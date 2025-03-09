// apps/api/src/redis/models/pubsub.model.ts
import { CategoryEvent } from '../../category/models/category.model';
import { ZoneEvent } from '../../zone/models/zone.model';
import { RoleEvent } from '../../rolle/models/discord-role.model';
import { ChannelEvent } from '../../channel/models/channel.model';
import { ObjectType, Field } from '@nestjs/graphql';

/**
 * Definiert alle Event-Typen, die über Redis PubSub ausgetauscht werden.
 * Verwendung von standardisierten Event-Typen anstelle spezifischer Payloads.
 */
export interface PubSubEvents {
  // Standardisierte Events für Kategorien
  categoryEvent: CategoryEvent;
  
  // Standardisierte Events für Zonen
  zoneEvent: ZoneEvent;
  
  // Standardisierte Events für Rollen
  roleEvent: RoleEvent;
  
  // Standardisierte Events für Channels
  channelEvent: ChannelEvent;
}

/**
 * Definiert die Struktur für Redis PubSub Subscriptions.
 * Wird verwendet, um Rückgabewerte von Subscription-Funktionen zu typisieren.
 */
export interface PubSubSubscription<T> {
  unsubscribe: () => void;
  data?: T;
}