import { ObjectType, Field, ID, Int, Float, InputType } from '@nestjs/graphql';

/**
 * Tags für Discord-Rollen
 */
@ObjectType({ description: 'Tags für Discord-Rollen' })
export class DiscordRoleTags {
  @Field(() => ID, { nullable: true, description: 'ID des Bots, der die Rolle erstellt hat' })
  botId?: string;

  @Field({ nullable: true, description: 'Gibt an, ob es sich um eine Premium-Abonnenten-Rolle handelt' })
  isPremiumSubscriberRole?: boolean;

  @Field(() => ID, { nullable: true, description: 'ID der Integration, die die Rolle erstellt hat' })
  integrationId?: string;
}

/**
 * Basis Discord Rolle Entity
 * Die zentrale Quelle der Wahrheit für den DiscordRole-Typ
 */
@ObjectType({ description: 'Repräsentiert eine Discord-Rolle' })
export class DiscordRole {
  @Field(() => ID, { description: 'Eindeutige ID der Discord-Rolle' })
  id: string;

  @Field({ description: 'Name der Rolle' })
  name: string;

  @Field(() => Int, { description: 'Farbcode der Rolle als Ganzzahl' })
  color: number;

  @Field({ description: 'Gibt an, ob die Rolle in der Mitgliederliste getrennt angezeigt wird' })
  isHoist: boolean;

  @Field(() => Int, { description: 'Position der Rolle in der Rollenliste' })
  position: number;

  @Field({ description: 'Berechtigungen der Rolle als Bitmaske' })
  permissions: string;

  @Field({ description: 'Gibt an, ob die Rolle von Discord verwaltet wird' })
  isManaged: boolean;

  @Field({ description: 'Gibt an, ob die Rolle erwähnbar ist' })
  isMentionable: boolean;

  @Field({ nullable: true, description: 'Icon der Rolle' })
  icon?: string;

  @Field({ nullable: true, description: 'Unicode-Emoji der Rolle' })
  unicodeEmoji?: string;

  @Field(() => Float, { description: 'Erstellungszeitstempel der Rolle in Unix-Zeit' })
  createdTimestamp: number;

  @Field({ description: 'Erstellungsdatum der Rolle als ISO-String' })
  createdAt: string;

  @Field(() => DiscordRoleTags, { nullable: true, description: 'Zusätzliche Tags der Rolle' })
  tags?: DiscordRoleTags;
}

/**
 * Filter für Discord-Rollen
 */
@InputType({ description: 'Filter für Discord-Rollen' })
export class DiscordRoleFilter {
  @Field({ nullable: true, description: 'Nach Rollennamen filtern' })
  name?: string;

  @Field({ nullable: true, description: 'Nur erwähnbare Rollen anzeigen' })
  isMentionable?: boolean;

  @Field({ nullable: true, description: 'Nur von Discord verwaltete Rollen anzeigen' })
  isManaged?: boolean;
}

/**
 * Standardisierter Event-Typ für alle Discord Role Events
 * Ersetzt alle spezifischen Event-Typen mit einer einzigen, flexiblen Event-Struktur
 */
@ObjectType({ description: 'Standard Discord Role Event Payload' })
export class RoleEvent {
  @Field({ description: 'ID der Anfrage für die Nachverfolgung' })
  requestId: string;

  @Field({ description: 'ID der Discord-Guild, für die Rollen angefordert werden' })
  guildId: string;
  
  @Field(() => [DiscordRole], { nullable: true, description: 'Liste der Discord-Rollen' })
  roles?: DiscordRole[];

  @Field({ nullable: true, description: 'Fehlermeldung, falls die Anfrage fehlgeschlagen ist' })
  error?: string;

  @Field({ description: 'Event Zeitstempel' })
  timestamp: string;

  @Field({ description: 'Event Typ: request, response, error, usw.' })
  eventType: string;
}