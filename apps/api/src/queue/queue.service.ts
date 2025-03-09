// apps/api/src/queue/queue.service.ts

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { Inject } from '@nestjs/common';
import { RedisPubSubService } from '../redis/redis-pubsub.service';
import { rateLimits } from '../config/rate-limits.config';
import { CategoryEvent } from '../category/models/category.model';
import { ZoneEvent } from '../zone/models/zone.model';

// Job-Namen als Konstanten definieren
export const QUEUE_NAMES = {
  CATEGORY: 'discord-category',
  ZONE: 'discord-zone'
};

// Job-Typen als Konstanten definieren
export const JOB_TYPES = {
  CREATE_CATEGORY: 'create-category',
  UPDATE_CATEGORY: 'update-category',
  DELETE_CATEGORY: 'delete-category',
  CREATE_ZONE: 'create-zone',
  UPDATE_ZONE: 'update-zone',
  DELETE_ZONE: 'delete-zone'
};

// Typdefinition für Job-Ergebnisse
interface JobResult {
  eventAllowed?: boolean;
  originalEvent?: CategoryEvent | ZoneEvent;
  delayed?: boolean;
  delayMs?: number;
}

// Map zur Nachverfolgung der neuesten Job-IDs pro Entität und Job-Typ
interface PendingJobs {
  jobId: string;     // Aktuelle Job-ID
  timestamp: number; // Zeitstempel des letzten Updates
  delayEndTime: number; // Wann der Delay enden soll
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  
  // Map zum Speichern der letzten Ausführungszeiten pro Kategorie/Zone
  private lastExecutionTimes = new Map<string, number>();
  
  // Map zur Nachverfolgung der Operationen pro Entity im Zeitfenster
  private operationsCounter = new Map<string, { count: number, windowStart: number }>();

  // Map zur Nachverfolgung der ausstehenden Jobs pro Entität
  // Key: entityId-eventType (z.B. "123-update-category")
  private pendingJobs = new Map<string, PendingJobs>();
  
  // Map zum Speichern der letzten Rate-Limit-Benachrichtigungen pro Entity
  // Für Anti-Flooding-Schutz, aber jede Änderung löst ein Event aus
  private lastRateLimitNotifications = new Map<string, number>();

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
    private readonly redisPubSub: RedisPubSubService
  ) {}

  async onModuleInit() {
    // Initialisiere Queues und Worker
    await this.initializeQueues();
    this.logger.log('Queue-Service erfolgreich initialisiert');
  }

  async onModuleDestroy() {
    // Cleanup: Alle Queues und Worker schließen
    for (const [name, queue] of this.queues.entries()) {
      this.logger.log(`Schließe Queue: ${name}`);
      await queue.close();
    }
    
    for (const [name, worker] of this.workers.entries()) {
      this.logger.log(`Schließe Worker: ${name}`);
      await worker.close();
    }
    
    for (const [name, events] of this.queueEvents.entries()) {
      this.logger.log(`Schließe Queue-Events: ${name}`);
      await events.close();
    }
  }

  private async initializeQueues() {
    // Kategorie-Queue initialisieren
    await this.initializeQueue(QUEUE_NAMES.CATEGORY, rateLimits.discord.category);
    
    // Zone-Queue initialisieren
    await this.initializeQueue(QUEUE_NAMES.ZONE, rateLimits.discord.zone);
  }

  private async initializeQueue(name: string, rateLimit: any) {
    const connection = {
      host: this.redisClient.options.host,
      port: this.redisClient.options.port
    };

    // Queue erstellen
    const queue = new Queue(name, {
      connection,
      defaultJobOptions: {
        attempts: rateLimit.maxRetries,
        backoff: {
          type: 'exponential',
          delay: rateLimit.backoffDelay
        },
        removeOnComplete: true,
        removeOnFail: 100 // Behalte die letzten 100 fehlgeschlagenen Jobs
      }
    });
    
    // Worker für die Queue erstellen
    const worker = new Worker(name, async (job: Job) => {
      return this.processJob(job, rateLimit);
    }, { connection });

    // QueueEvents für Ereignisse
    const queueEvents = new QueueEvents(name, { connection });

    // Event-Listener für Queue-Ereignisse
    queueEvents.on('completed', async ({ jobId, returnvalue }) => {
      this.logger.log(`Job ${jobId} erfolgreich abgeschlossen mit Rückgabewert:`, returnvalue);
      
      try {
        // Bei Erfolg direkt das Event veröffentlichen
        const result = typeof returnvalue === 'string' 
          ? JSON.parse(returnvalue) as JobResult 
          : returnvalue as JobResult;
          
        if (result && result.eventAllowed && result.originalEvent) {
          // Bestimme den Event-Typ (category oder zone) basierend auf der Queue
          const eventType = name === QUEUE_NAMES.CATEGORY ? 'categoryEvent' : 'zoneEvent';
          await this.redisPubSub.publish(eventType, result.originalEvent);
          
          const idField = 'id' in result.originalEvent ? result.originalEvent.id : 'unbekannt';
          this.logger.log(`Event für ${idField} nach erfolgreicher Rate-Limit-Prüfung veröffentlicht`);
        }
      } catch (error) {
        this.logger.error('Fehler beim Verarbeiten des Job-Ergebnisses:', error);
      }
    });

    queueEvents.on('failed', async ({ jobId, failedReason }) => {
      this.logger.error(`Job ${jobId} fehlgeschlagen: ${failedReason}`);
    });

    // Worker-Events
    worker.on('completed', (job: Job, result: any) => {
      try {
        // Wenn der Job erfolgreich war und nicht verzögert wurde, aktualisiere die letzte Ausführungszeit
        const parsedResult = typeof result === 'string' ? JSON.parse(result) as JobResult : result as JobResult;
        
        // Extrahiere die ID basierend auf den Job-Daten
        const entityId = job.data.categoryId || job.data.zoneId;
        
        if (entityId && 
            job.data.eventData && 
            job.data.eventData.eventType !== 'queued' && 
            !parsedResult?.delayed) {
          this.lastExecutionTimes.set(entityId, Date.now());
          this.logger.log(`Letzte Ausführungszeit für Entity ${entityId} aktualisiert: ${new Date().toISOString()}`);
          
          // Entferne den Job aus der pendingJobs-Liste
          const jobKey = this.getJobKey(entityId, job.data.eventType);
          if (this.pendingJobs.has(jobKey)) {
            this.pendingJobs.delete(jobKey);
            this.logger.log(`Job ${jobKey} aus pendingJobs entfernt nach erfolgreicher Ausführung`);
          }
        }
      } catch (error) {
        this.logger.error('Fehler beim Verarbeiten des completed Events:', error);
      }
    });

    // Queue und Events speichern
    this.queues.set(name, queue);
    this.workers.set(name, worker);
    this.queueEvents.set(name, queueEvents);
    this.logger.log(`Queue und Worker für ${name} initialisiert`);
    
    // Vorhandene Jobs in der Queue bereinigen - wichtig bei Neustart
    const jobs = await queue.getJobs();
    this.logger.log(`${jobs.length} vorhandene Jobs in Queue ${name} gefunden`);
    
    // Gruppiere Jobs nach Entity-ID
    const jobsByEntity = new Map<string, Job[]>();
    
    for (const job of jobs) {
      const entityId = job.data.categoryId || job.data.zoneId;
      const eventType = job.data.eventType;
      if (!entityId || !eventType) continue;
      
      const key = this.getJobKey(entityId, eventType);
      if (!jobsByEntity.has(key)) {
        jobsByEntity.set(key, []);
      }
      jobsByEntity.get(key)?.push(job);
    }
    
    // Behalte nur den neuesten Job pro Entity und EventType
    for (const [key, entityJobs] of jobsByEntity.entries()) {
      if (entityJobs.length <= 1) continue;
      
      // Sortiere Jobs nach Erstellungszeitpunkt (neueste zuerst)
      entityJobs.sort((a, b) => {
        const aTime = new Date(a.data.timestamp).getTime();
        const bTime = new Date(b.data.timestamp).getTime();
        return bTime - aTime;
      });
      
      // Behalte den neuesten Job
      const latestJob = entityJobs[0];
      
      // Entferne alle älteren Jobs
      for (let i = 1; i < entityJobs.length; i++) {
        const job = entityJobs[i];
        this.logger.log(`Entferne veralteten Job ${job.id} für Entity ${key}`);
        await job.remove();
      }
      
      this.logger.log(`Neuester Job ${latestJob.id} für Entity ${key} beibehalten`);
    }
  }

  /**
   * Erstellt einen einheitlichen Schlüssel für Jobs basierend auf Entity-ID und Event-Typ
   */
  private getJobKey(entityId: string, eventType: string): string {
    return `${entityId}-${eventType}`;
  }

  /**
   * Verarbeitet einen Job unter Berücksichtigung des Rate-Limits
   */
  private async processJob(job: Job, rateLimit: any): Promise<JobResult> {
    // Extrahiere die relevante ID (categoryId oder zoneId)
    const entityId = job.data.categoryId || job.data.zoneId;
    const eventType = job.data.eventType;
    const eventData = job.data.eventData;
    const queueName = job.queueName;
    
    try {
      // Prüfe, ob dieser Job noch der neueste ist
      const jobKey = this.getJobKey(entityId, eventType);
      const pendingJob = this.pendingJobs.get(jobKey);
      
      if (pendingJob && pendingJob.jobId !== job.id) {
        this.logger.log(`Job ${job.id} übersprungen, da er nicht mehr aktuell ist. Aktueller Job: ${pendingJob.jobId}`);
        return { delayed: true, delayMs: 0 };
      }
      
      // Rate-Limit-Prüfung VOR der Verarbeitung
      const canProcess = await this.checkRateLimit(job, rateLimit);
      if (!canProcess.allowed) {
        // Wenn das Rate-Limit erreicht ist, fügen wir den Job mit Verzögerung erneut hinzu
        this.logger.log(`Rate-Limit erreicht für Entity ${entityId}. Verzögere Job um ${canProcess.delayMs}ms`);
        
        // Prüfe, ob ein bestehender verzögerter Job existiert und entferne ihn
        const queue = this.queues.get(queueName);
        if (queue) {
          const delayedJobs = await queue.getDelayed();
          for (const delayedJob of delayedJobs) {
            const delayedEntityId = delayedJob.data.categoryId || delayedJob.data.zoneId;
            const delayedEventType = delayedJob.data.eventType;
            
            // Wenn es sich um einen Job für dieselbe Entity und denselben Typ handelt, entferne ihn
            if (delayedEntityId === entityId && delayedEventType === eventType && delayedJob.id !== job.id) {
              this.logger.log(`Entferne veralteten verzögerten Job ${delayedJob.id} für Entity ${entityId}`);
              await delayedJob.remove();
            }
          }
          
          // Job mit Verzögerung erneut zur Queue hinzufügen
          const newJobId = `${entityId}-${eventType}-${Date.now()}`;
          await queue.add(
            job.name,
            job.data,
            {
              jobId: newJobId,
              delay: canProcess.delayMs,
              removeOnComplete: true
            }
          );
          
          // WICHTIG: Aktualisiere pendingJobs VOR dem Senden des Events
          // Dies stellt sicher, dass der delayEndTime-Wert bereits aktualisiert ist
          this.pendingJobs.set(jobKey, {
            jobId: newJobId,
            timestamp: Date.now(),
            delayEndTime: Date.now() + canProcess.delayMs
          });
          
          this.logger.log(`Neuer verzögerter Job ${newJobId} für Entity ${entityId} hinzugefügt, Verzögerung: ${canProcess.delayMs}ms`);
          
          // NACH dem Update der pendingJobs das Event veröffentlichen
          await this.publishRateLimitEvent(eventData, canProcess.delayMs, queueName);
        }
        
        // Erfolg zurückgeben, damit der Job als abgeschlossen gilt
        return { delayed: true, delayMs: canProcess.delayMs };
      }
      
      // Wenn das Rate-Limit nicht erreicht ist, erlaube das Event
      this.logger.log(`Rate-Limit OK für Entity ${entityId}. Erlaube Event vom Typ ${eventType}`);
      
      // Erfolg zurückgeben mit originalem Event
      return { 
        originalEvent: eventData,
        eventAllowed: true
      };
    } catch (error) {
      this.logger.error(`Fehler beim Verarbeiten des Jobs ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Prüft, ob ein Job das Rate-Limit einhält
   * Verbesserte Implementierung für korrekte Zählung der Operationen pro Entity
   */
  private async checkRateLimit(job: Job, rateLimit: any): Promise<{ allowed: boolean, delayMs: number }> {
    // Extrahiere die relevante ID (categoryId oder zoneId)
    const entityId = job.data.categoryId || job.data.zoneId;
    const jobName = job.name;
    
    if (!entityId) {
      // Wenn keine Entity-ID vorhanden ist, erlaube die Ausführung
      this.logger.warn(`Job ${job.id} hat keine Entity-ID. Erlaube Ausführung.`);
      return { allowed: true, delayMs: 0 };
    }
    
    this.logger.log(`[RATE-LIMIT-CONFIG-DEBUG] Konfiguriertes Limit: ${rateLimit.operations}, Standard: 2`);
    
    const now = Date.now();
    // Stellen Sie sicher, dass immer ein Wert für operationsLimit definiert ist
    const operationsLimit = rateLimit.operations || 2;
    const windowMs = rateLimit.windowMs || 10 * 60 * 1000; // 10 Minuten als Standard
    
    // Aktuellen Zähler holen oder initialisieren
    let counter = this.operationsCounter.get(entityId);
    
    this.logger.log(`[RATE-LIMIT-INIT] Counter für Entity ${entityId}: ${counter ? `count=${counter.count}, windowStart=${counter.windowStart}` : "nicht vorhanden"}`);
    // Detailliertes Debug-Logging
    this.logger.log(`[RATE-LIMIT-CHECK] Job ${job.id}, Typ: ${jobName}, Entity: ${entityId}`);
    this.logger.log(`[RATE-LIMIT-CONFIG] Operationslimit: ${operationsLimit}, Zeitfenster: ${windowMs}ms`);
    
    // Prüfen, ob das Zeitfenster abgelaufen ist oder neu erstellt werden muss
    if (!counter || (now - counter.windowStart) >= windowMs) {
      // Neues Zeitfenster starten
      counter = { count: 0, windowStart: now };
      this.operationsCounter.set(entityId, counter);
      this.logger.log(`[RATE-LIMIT-NEW] Neues Zeitfenster für Entity ${entityId} gestartet.`);
    }
    
    // Stellen Sie sicher, dass counter.count immer definiert ist
    if (counter.count === undefined) {
      this.logger.error(`[RATE-LIMIT-ERROR] counter.count ist undefined für Entity ${entityId}. Setze auf 0.`);
      counter.count = 0;
      this.operationsCounter.set(entityId, counter);
    }
    
    // Bisherige Operationen im aktuellen Zeitfenster
    this.logger.log(`[RATE-LIMIT-STATUS] Aktuelle Operationen: ${counter.count}/${operationsLimit}`);
    this.logger.log(`[RATE-LIMIT-WINDOW] Verbleibend: ${Math.round((counter.windowStart + windowMs - now)/1000)}s`);
    
    // Prüfen, ob noch Operationen im Limit erlaubt sind - expliziter Vergleich
    const isUnderLimit = counter.count <= operationsLimit - 1;
    this.logger.log(`[RATE-LIMIT-CHECK] Counter: ${counter.count}, Limit: ${operationsLimit}, Vergleich: ${isUnderLimit}`);
    this.logger.log(`[RATE-LIMIT-DETAIL] JobID: ${job.id}, EntityID: ${entityId}, JobTyp: ${jobName}`);
    
    if (isUnderLimit) {
      // Operation erlauben und Zähler erhöhen
      const newCount = counter.count + 1;
      counter.count = newCount;
      this.operationsCounter.set(entityId, counter);
      this.logger.log(`[RATE-LIMIT-ALLOWED] Operation für Entity ${entityId} erlaubt. Zähler erhöht: ${newCount}/${operationsLimit}`);
      
      // Zusätzliche Überprüfung, ob der Zähler korrekt erhöht wurde
      this.logger.log(`[RATE-LIMIT-COUNTER-UPDATE] Counter für Entity ${entityId} aktualisiert auf ${counter.count}/${operationsLimit}`);
      // Letzte Ausführungszeit für andere Berechnungen aktualisieren
      this.lastExecutionTimes.set(entityId, now);
      
      return { allowed: true, delayMs: 0 };
    } else {
      // Limit erreicht, Verzögerung berechnen
      const windowEnd = counter.windowStart + windowMs;
      const delayMs = windowEnd - now;
      
      this.logger.log(`[RATE-LIMIT-BLOCKED] Entity ${entityId}: Limit (${operationsLimit}) erreicht. Zähler: ${counter.count}`);
      this.logger.log(`[RATE-LIMIT-DELAYED] Verzögerung: ${Math.round(delayMs/1000)}s, bis: ${new Date(now + delayMs).toISOString()}`);
      
      return { allowed: false, delayMs: delayMs > 0 ? delayMs : 0 };
    }
  }

  /**
   * Veröffentlicht ein Rate-Limit-Event an das Dashboard
   * Jede Anfrage soll ein Event auslösen, mit minimaler Verzögerung bei Burst-Events
   */
  private async publishRateLimitEvent(eventData: any, delayMs: number, queueName: string): Promise<void> {
    try {
      const entityId = eventData.id;
      const now = Date.now();
      
      // Hole den letzten Zeitstempel, aber blocke KEINE Events
      const lastNotificationTime = this.lastRateLimitNotifications.get(entityId) || 0;
      
      // Wenn Events zu schnell kommen (weniger als 100ms auseinander),
      // füge eine kleine Verzögerung hinzu, um sie zu staffeln
      let notificationDelay = 0;
      if (now - lastNotificationTime < 100) {
        notificationDelay = 150; // 150ms Verzögerung
        this.logger.log(`[publishRateLimitEvent] Rate-Limit-Events kommen schnell für ${entityId} - kleine Verzögerung (${notificationDelay}ms) hinzugefügt`);
        
        // Kleine Verzögerung hinzufügen
        await new Promise(resolve => setTimeout(resolve, notificationDelay));
      }
      
      // Aktualisiere den Zeitstempel NACH der möglichen Verzögerung
      this.lastRateLimitNotifications.set(entityId, Date.now());
      
      // Debug-Logging hinzufügen
      this.logger.log(`[publishRateLimitEvent] Veröffentliche Rate-Limit-Event für ${entityId}, Verzögerung: ${delayMs}ms`);
      
      const scheduledTime = new Date(Date.now() + delayMs);
      const eventType = queueName === QUEUE_NAMES.CATEGORY ? 'categoryEvent' : 'zoneEvent';
      
      // Rate-Limit-Event erstellen (basierend auf dem ursprünglichen Event)
      const rateLimitEvent: any = {
        id: entityId,
        timestamp: new Date().toISOString(),
        eventType: 'rateLimit',
        // Zusätzliches Feld für Direktzugriff (nicht nur in details)
        error: `Discord Rate Limit: Änderung wird in ${Math.ceil(delayMs / 60000)} Minute(n) durchgeführt`,
        details: JSON.stringify({
          originalEventType: eventData.eventType,
          delayMs: delayMs,
          delayMinutes: Math.ceil(delayMs / 60000),
          scheduledTime: scheduledTime.toISOString(),
          entityName: eventData.name || '',
          // Eindeutiger Zeitstempel für jedes Event
          timestamp: Date.now()
        })
      };
      
      // Füge zusätzliche Felder hinzu, die spezifisch für den Typ sind
      if (queueName === QUEUE_NAMES.CATEGORY) {
        rateLimitEvent.guildId = eventData.guildId || '';
        rateLimitEvent.name = eventData.name || '';
        rateLimitEvent.discordCategoryId = eventData.discordCategoryId || '';
      } else {
        rateLimitEvent.categoryId = eventData.categoryId || '';
        rateLimitEvent.name = eventData.name || '';
        rateLimitEvent.discordVoiceId = eventData.discordVoiceId || '';
      }
      
      // Event direkt an das Dashboard senden (nicht an den Bot)
      await this.redisPubSub.publish(eventType, rateLimitEvent);
      
      this.logger.log(`Rate-Limit-Event für Entity ${entityId} veröffentlicht. Geplante Ausführung: ${scheduledTime.toISOString()}`);
    } catch (error) {
      this.logger.error(`Fehler beim Veröffentlichen des Rate-Limit-Events:`, error);
    }
  }

  /**
   * Fügt ein Event zur Verarbeitung hinzu mit verbesserter Deduplizierung
   */
  async processEvent(eventType: string, eventData: CategoryEvent | ZoneEvent): Promise<void> {
    const isZoneEvent = 'discordVoiceId' in eventData;
    const queueName = isZoneEvent ? QUEUE_NAMES.ZONE : QUEUE_NAMES.CATEGORY;
    const entityId = eventData.id;
    const jobKey = this.getJobKey(entityId, eventType);
    
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue ${queueName} nicht gefunden`);
    }

    // Eindeutige Job-ID basierend auf Entity-ID, Event-Typ und aktuellem Zeitstempel
    const timestamp = Date.now();
    const jobId = `${eventType}:${entityId}:${timestamp}`;

    // Gemeinsame Job-Daten
    const jobData: any = {
      eventType,
      eventData, // Das eigentliche Event
      timestamp: new Date().toISOString(),
    };
    
    // Spezifische Felder je nach Event-Typ
    if (isZoneEvent) {
      jobData.zoneId = entityId;
    } else {
      jobData.categoryId = entityId;
    }

    // WICHTIG: Prüfe, ob bereits ein Job für diese Entity in der Queue ist
    const pendingJob = this.pendingJobs.get(jobKey);

    // Wenn ein früherer Job existiert und noch verzögert ist, entferne ihn
    if (pendingJob) {
      this.logger.log(`Existierender Job für ${jobKey} gefunden: ${pendingJob.jobId}`);
      
      // Prüfe, ob der Job bereits in Verzögerung ist
      if (pendingJob.delayEndTime > Date.now()) {
        const remainingDelay = pendingJob.delayEndTime - Date.now();
        this.logger.log(`Sofortiger Rate-Limit-Check: Entity ${entityId} bereits verzögert für ${Math.round(remainingDelay/1000)}s`);
        
        // Sofort ein Rate-Limit-Event veröffentlichen
        await this.publishRateLimitEvent(
          eventData, 
          remainingDelay, 
          isZoneEvent ? QUEUE_NAMES.ZONE : QUEUE_NAMES.CATEGORY
        );
        
        try {
          // Versuche, den alten Job zu finden und zu entfernen
          const delayedJobs = await queue.getDelayed();
          let oldJobFound = false;
          
          for (const delayedJob of delayedJobs) {
            if (delayedJob.id === pendingJob.jobId) {
              this.logger.log(`Entferne alten verzögerten Job ${pendingJob.jobId} für ${jobKey}`);
              await delayedJob.remove();
              oldJobFound = true;
              break;
            }
          }
          
          if (!oldJobFound) {
            this.logger.warn(`Alter Job ${pendingJob.jobId} für ${jobKey} nicht in der Queue gefunden`);
          }
        } catch (error) {
          this.logger.error(`Fehler beim Entfernen des alten Jobs ${pendingJob.jobId}:`, error);
        }
      }
    }

    // Füge das Event zur Verarbeitung hinzu
    const job = await queue.add(eventType, jobData, { jobId });
    
    // Aktualisiere pendingJobs mit dem neuen Job
    // Stelle sicher, dass job.id ein String ist, da es potentiell undefined sein könnte
    const jobIdString = job.id !== undefined ? String(job.id) : jobId;
    
    this.pendingJobs.set(jobKey, {
      jobId: jobIdString,
      timestamp: timestamp,
      delayEndTime: 0 // Wird aktualisiert, wenn der Job verzögert wird
    });

    this.logger.log(`Event vom Typ ${eventType} für Entity ${entityId} zur Queue ${queueName} hinzugefügt (Job-ID: ${job.id})`);
    
    // Informiere das Dashboard über die Warteschlange (optional)
    if (eventData.eventType !== 'queued') {
      const queuedEventData: any = {
        id: entityId,
        timestamp: new Date().toISOString(),
        eventType: 'queued',
        details: JSON.stringify({
          jobId: job.id,
          estimatedDelay: await this.getEstimatedDelay(entityId),
          originalEventType: eventData.eventType
        })
      };
      
      // Füge spezifische Felder basierend auf dem Event-Typ hinzu
      if (isZoneEvent) {
        const zoneEvent = eventData as ZoneEvent;
        queuedEventData.categoryId = zoneEvent.categoryId || '';
        queuedEventData.name = zoneEvent.name || '';
        queuedEventData.discordVoiceId = zoneEvent.discordVoiceId || '';
        await this.redisPubSub.publish('zoneEvent', queuedEventData);
      } else {
        const categoryEvent = eventData as CategoryEvent;
        queuedEventData.guildId = categoryEvent.guildId || '';
        queuedEventData.name = categoryEvent.name || '';
        queuedEventData.discordCategoryId = categoryEvent.discordCategoryId || '';
        await this.redisPubSub.publish('categoryEvent', queuedEventData);
      }
    }
  }
  
  /**
   * Berechnet die geschätzte Verzögerung für eine Entity
   */
  private async getEstimatedDelay(entityId: string): Promise<number> {
    const now = Date.now();
    const counter = this.operationsCounter.get(entityId);
    
    // Keine Verzögerung, wenn noch kein Counter existiert oder Zeitfenster abgelaufen
    if (!counter) {
      return 0;
    }
    
    // Verwende die richtigen Limits je nach Entity-Typ
    // Wir haben zwei Queues, aber nutzen hier nur Category als Fallback
    const rateLimit = rateLimits.discord.category;
    const operationsLimit = rateLimit.operations || 2;
    const windowMs = rateLimit.windowMs || 10 * 60 * 1000;
    
    // Wenn das Zeitfenster abgelaufen ist oder noch Operationen verfügbar sind
    if ((now - counter.windowStart) >= windowMs || counter.count < operationsLimit) {
      return 0;
    }
    
    // Berechne die verbleibende Zeit im aktuellen Fenster
    const windowEnd = counter.windowStart + windowMs;
    return Math.max(0, windowEnd - now);
  }

  /**
   * KOMPATIBILITÄTSMETHODE: Fügt einen Job zur Kategorie-Queue hinzu
   * Diese Methode ist für die Kompatibilität mit bestehendem Code und ruft intern processEvent auf
   */
  async addCategoryJob(
    type: string, 
    data: any, 
    categoryId: string, 
    jobOptions: any = {}
  ) {
    this.logger.log(`Kompatibilitätsaufruf: addCategoryJob für Kategorie ${categoryId}`);
    
    // Erstelle ein CategoryEvent aus den rohen Daten
    const eventData: CategoryEvent = {
      id: categoryId,
      guildId: data.guildId || '',
      name: data.name || '',
      discordCategoryId: data.discordCategoryId || '',
      timestamp: new Date().toISOString(),
      eventType: this.mapJobTypeToEventType(type)
    };
    
    // Rufe die neue Methode processEvent auf
    await this.processEvent(type, eventData);
    
    // Dummy-Job-Objekt zurückgeben für Kompatibilität
    return { id: `${type}:${categoryId}:${Date.now()}` };
  }

  /**
   * Fügt einen Job zur Zone-Queue hinzu
   */
  async addZoneJob(
    type: string, 
    data: any, 
    zoneId: string, 
    jobOptions: any = {}
  ) {
    this.logger.log(`addZoneJob für Zone ${zoneId}`);
    
    // Erstelle ein ZoneEvent aus den rohen Daten
    const eventData: ZoneEvent = {
      id: zoneId,
      categoryId: data.categoryId || '',
      name: data.name || '',
      discordVoiceId: data.discordVoiceId || '',
      timestamp: new Date().toISOString(),
      eventType: this.mapJobTypeToEventType(type)
    };
    
    // Rufe die neue Methode processEvent auf
    await this.processEvent(type, eventData);
    
    // Dummy-Job-Objekt zurückgeben für Kompatibilität
    return { id: `${type}:${zoneId}:${Date.now()}` };
  }
  
  /**
   * Mappt einen Job-Typ auf einen Event-Typ
   */
  private mapJobTypeToEventType(jobType: string): string {
    switch (jobType) {
      case JOB_TYPES.CREATE_CATEGORY:
      case JOB_TYPES.CREATE_ZONE:
        return 'created';
      case JOB_TYPES.UPDATE_CATEGORY:
      case JOB_TYPES.UPDATE_ZONE:
        return 'updated';
      case JOB_TYPES.DELETE_CATEGORY:
      case JOB_TYPES.DELETE_ZONE:
        return 'deleted';
      default:
        return 'unknown';
    }
  }
}