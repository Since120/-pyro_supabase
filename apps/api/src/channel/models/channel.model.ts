import { Field, ObjectType, ID, InputType } from '@nestjs/graphql';

/**
 * Basis Discord Channel Entity
 * Die zentrale Quelle der Wahrheit für den DiscordChannel-Typ
 */
@ObjectType({ description: 'Repräsentiert einen Discord-Channel' })
export class DiscordChannel {
  @Field(() => ID, { description: 'Eindeutige ID des Discord-Channels' })
  id: string;

  @Field({ description: 'Name des Channels' })
  name: string;

  @Field({ description: 'Typ des Channels' })
  type: string;

  @Field({ nullable: true, description: 'ID der übergeordneten Kategorie' })
  parentId?: string;

  @Field({ description: 'Position des Channels in der Liste' })
  position: number;

  @Field({ description: 'ID der Guild, zu der dieser Channel gehört' })
  guildId: string;
}

/**
 * Filter für Discord-Channels
 */
@InputType({ description: 'Filter für Discord-Channels' })
export class DiscordChannelFilter {
  @Field({ nullable: true, description: 'Nach Channelnamen filtern' })
  name?: string;

  @Field({ nullable: true, description: 'Nach Channeltyp filtern' })
  type?: string;

  @Field({ nullable: true, description: 'Nach übergeordneter Kategorie filtern' })
  parentId?: string;
}

/**
 * Standardisierter Event-Typ für alle Channel Events
 * Ersetzt alle spezifischen Event-Typen mit einer einzigen, flexiblen Event-Struktur
 */
@ObjectType({ description: 'Standard Channel Event Payload' })
export class ChannelEvent {
  @Field({ description: 'ID der Anfrage für die Nachverfolgung' })
  requestId: string;

  @Field({ description: 'ID der Discord-Guild, für die Channels angefordert werden' })
  guildId: string;

  @Field(() => [DiscordChannel], { nullable: true, description: 'Liste der Discord-Channels' })
  channels?: DiscordChannel[];
  
  @Field({ nullable: true, description: 'Discord Channel ID bei spezifischen Events' })
  channelId?: string;

  @Field({ nullable: true, description: 'Fehlermeldung, falls die Anfrage fehlgeschlagen ist' })
  error?: string;

  @Field({ description: 'Event Zeitstempel' })
  timestamp: string;

  @Field({ description: 'Event Typ: request, response, error, created, updated, deleted, usw.' })
  eventType: string;
}