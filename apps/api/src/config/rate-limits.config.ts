// apps/api/src/config/rate-limits.config.ts
export const rateLimits = {
  discord: {
    category: {
      // Anzahl Operationen pro Zeitfenster (Discord Limit: 2 pro 10min)
      operations: 2,
      // Zeitfenster in Millisekunden (10 Minuten)
      windowMs: 10 * 60 * 1000,
      // Max. Anzahl Wiederholungsversuche bei Fehlern
      maxRetries: 3,
      // Basis-Wartezeit für Backoff
      backoffDelay: 1000
    },
    // Hier können weitere Discord-Limits hinzugefügt werden
    zone: {
      operations: 2,
      windowMs: 10 * 60 * 1000,
      maxRetries: 3,
      backoffDelay: 1000
    }
  }
};