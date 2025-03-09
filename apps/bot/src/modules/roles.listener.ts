// apps/bot/src/modules/roles.listener.ts
import { Client, Role } from 'discord.js';
import { supabase } from 'pyro-types';
import logger from 'pyro-logger';

/**
 * RolesListener - Hört auf Discord-Rolle-Ereignisse und synchronisiert sie mit Supabase
 * Diese Klasse ersetzt die frühere Redis-PubSub-Implementierung
 */
export class RolesListener {
  constructor(private readonly client: Client) {
    this.initialize();
    logger.info('Roles Listener initialisiert');
  }

  private initialize() {
    // Geplante Synchronisierung der Rollen für alle Guilds
    setInterval(() => {
      this.syncAllGuildsRoles();
    }, 3600000); // Stündliche Synchronisierung

    // Initial alle Rollen synchronisieren, sobald der Bot bereit ist
    this.client.once('ready', () => {
      logger.info('Bot bereit, synchronisiere alle Discord-Rollen...');
      this.syncAllGuildsRoles();
    });
    
    // Sofortige Synchronisierung erzwingen (für Debugging)
    setTimeout(() => {
      logger.info('Erzwinge sofortige Rollensynchronisierung...');
      this.syncAllGuildsRoles();
    }, 5000);
  }

  /**
   * Synchronisiert alle Rollen von allen Guilds, in denen der Bot Mitglied ist
   */
  private async syncAllGuildsRoles(): Promise<void> {
    try {
      // Alle Guilds synchronisieren
      const guilds = this.client.guilds.cache;
      logger.info(`Synchronisiere Rollen für ${guilds.size} Guilds...`);
      
      // DEBUG: Liste alle verfügbaren Guilds
      logger.info(`Verfügbare Guilds: ${[...guilds.values()].map(g => `${g.name} (${g.id})`).join(', ')}`);

      if (guilds.size === 0) {
        logger.warn('Keine Guilds gefunden! Bot muss auf mindestens einem Discord-Server sein.');
        return;
      }

      for (const [guildId, guild] of guilds) {
        try {
          logger.info(`Starte Synchronisierung für Guild ${guildId} (${guild.name})...`);
          const roles = await this.syncGuildRoles(guildId);
          logger.info(`${roles.length} Rollen für Guild ${guildId} (${guild.name}) erfolgreich synchronisiert`);
        } catch (err) {
          logger.error(`Fehler bei der Synchronisierung der Rollen für Guild ${guildId}:`, err);
        }
      }
    } catch (error) {
      logger.error('Fehler bei der Synchronisierung aller Guilds:', error);
    }
  }

  /**
   * Synchronisiert die Rollen einer bestimmten Guild mit Supabase
   * @param guildId ID der Discord-Guild
   * @returns Array der synchronisierten Rollen als einfache Objekte mit ihren Eigenschaften
   */
  private async syncGuildRoles(guildId: string): Promise<Array<Record<string, any>>> {
    try {
      // Holen der Guild
      logger.info(`Versuche Guild mit ID ${guildId} abzurufen...`);
      const guild = await this.client.guilds.fetch(guildId);
      if (!guild) {
        throw new Error(`Guild mit ID ${guildId} nicht gefunden`);
      }
      logger.info(`Guild gefunden: ${guild.name} (${guild.id})`);

      // Discord-Rollen abrufen
      logger.info(`Rufe Rollen für Guild ${guild.name} ab...`);
      await guild.roles.fetch();
      const discordRoles = guild.roles.cache;
      logger.info(`${discordRoles.size} Rollen gefunden für Guild ${guild.name}`);
      
      // DEBUG: Ausgabe aller gefundenen Rollen
      logger.info(`Gefundene Rollen: ${[...discordRoles.values()].map(r => `${r.name} (${r.id})`).join(', ')}`);
      
      // Rollen in einfache Objekte konvertieren, die für Supabase geeignet sind
      const roles = discordRoles.map(role => this.convertRoleToObject(role, guildId));
      logger.info(`${roles.length} Rollen für Supabase konvertiert`);

      // Jede Rolle in Supabase discord_sync speichern
      logger.info(`Speichere Rollen in Supabase...`);
      let successCount = 0;
      let errorCount = 0;
      
      for (const roleData of roles) {
        // Upsert in discord_sync Tabelle
        try {
          const { error } = await supabase
            .from('discord_sync')
            .upsert(roleData);

          if (error) {
            logger.error(`Fehler beim Speichern der Rolle ${roleData.id} (${roleData.data.name}):`, error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          logger.error(`Unerwarteter Fehler beim Speichern der Rolle ${roleData.id}:`, err);
          errorCount++;
        }
      }

      logger.info(`Rollensynchronisierung abgeschlossen: ${successCount} erfolgreich, ${errorCount} fehlgeschlagen`);
      
      // Löschen von Rollen, die nicht mehr in Discord existieren
      const currentRoleIds = roles.map(r => r.id);
      
      // Holen aller gespeicherten Rollen für diese Guild
      logger.info(`Prüfe auf veraltete Rollen in Supabase...`);
      const { data: storedRoles, error: fetchError } = await supabase
        .from('discord_sync')
        .select('id')
        .eq('guild_id', guildId)
        .eq('entity_type', 'role');

      if (fetchError) {
        logger.error(`Fehler beim Abrufen gespeicherter Rollen für Guild ${guildId}:`, fetchError);
      } else if (storedRoles) {
        logger.info(`${storedRoles.length} gespeicherte Rollen in Supabase gefunden`);
        
        // Finden von Rollen, die nicht mehr in Discord existieren
        const rolesToDelete = storedRoles
          .filter(r => !currentRoleIds.includes(r.id))
          .map(r => r.id);

        if (rolesToDelete.length > 0) {
          logger.info(`Lösche ${rolesToDelete.length} nicht mehr existierende Rollen für Guild ${guildId}`);
          
          // Löschen der Rollen aus Supabase
          const { error: deleteError } = await supabase
            .from('discord_sync')
            .delete()
            .in('id', rolesToDelete);

          if (deleteError) {
            logger.error(`Fehler beim Löschen veralteter Rollen für Guild ${guildId}:`, deleteError);
          } else {
            logger.info(`${rolesToDelete.length} veraltete Rollen erfolgreich gelöscht`);
          }
        } else {
          logger.info(`Keine veralteten Rollen zu löschen`);
        }
      }

      return roles;
    } catch (error) {
      logger.error(`Fehler bei der Synchronisierung von Rollen für Guild ${guildId}:`, error);
      throw error;
    }
  }

  /**
   * Konvertiert eine Discord.js Role in ein Objekt, das für Supabase geeignet ist
   * Stellt sicher, dass die Struktur genau dem erwarteten Datentypformat entspricht
   */
  private convertRoleToObject(role: Role, guildId: string): {
    id: string,
    entity_type: string,
    guild_id: string,
    data: any,
    sync_status: string,
    last_synced_at: string
  } {
    return {
      id: role.id,
      entity_type: 'role',
      guild_id: guildId,
      data: {
        name: role.name,
        color: role.color,
        is_hoist: role.hoist,
        position: role.position,
        permissions: role.permissions.bitfield.toString(),
        is_managed: role.managed,
        is_mentionable: role.mentionable,
        created_at: role.createdAt.toISOString(),
        created_timestamp: role.createdTimestamp,
        role_tags: role.tags ? {
          bot_id: role.tags.botId,
          is_premium_subscriber_role: role.tags.premiumSubscriberRole,
          integration_id: role.tags.integrationId
        } : null
      },
      sync_status: 'synced',
      last_synced_at: new Date().toISOString()
    };
  }
}