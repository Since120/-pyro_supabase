// apps/api/src/category/models/category.model.ts
import { Field, ObjectType, InputType, ID } from '@nestjs/graphql';

/**
 * Repräsentiert eine Kategorie im System.
 * Grundlegende Entität, die Informationen über Discord-Kategorien enthält.
 */
@ObjectType({ description: 'Repräsentiert eine Kategorie im System' })
export class Category {
  @Field(() => ID, { description: 'Eindeutige ID der Kategorie' })
  id: string;

  @Field({ description: 'ID der Discord-Guild, zu der diese Kategorie gehört' })
  guildId: string;

  @Field({ description: 'Name der Kategorie' })
  name: string;

  @Field({ description: 'Typ der Kategorie' })
  categoryType: string;

  @Field({ description: 'Gibt an, ob die Kategorie sichtbar ist' })
  isVisible: boolean;

  @Field({ description: 'Gibt an, ob Tracking für diese Kategorie aktiviert ist' })
  isTrackingActive: boolean;

  @Field({ description: 'Gibt an, ob Setup-Nachrichten gesendet werden sollen' })
  isSendSetup: boolean;

  @Field(() => [String], { description: 'Rollen, die auf diese Kategorie zugreifen dürfen' })
  allowedRoles: string[];

  @Field({ nullable: true, description: 'Discord-ID der Kategorie' })
  discordCategoryId?: string;

  @Field({ description: 'Gibt an, ob die Kategorie in Discord gelöscht wurde' })
  isDeletedInDiscord: boolean;

  @Field({ nullable: true, description: 'Letzte Nutzung der Kategorie' })
  lastUsageAt?: Date;

  @Field({ description: 'Gesamtzeit in Sekunden, die in dieser Kategorie verbracht wurde' })
  totalSecondsInCategory: number;
  
  @Field({ description: 'Erstellungszeitpunkt der Kategorie' })
  createdAt: Date;
  
  @Field({ description: 'Letzter Aktualisierungszeitpunkt der Kategorie' })
  updatedAt: Date;
}

/**
 * Minimale Kategorie-Repräsentation für Events
 */
@ObjectType({ description: 'Minimale Kategorie-Repräsentation für Events' })
export class CategoryBasic {
  @Field(() => ID, { description: 'Eindeutige ID der Kategorie' })
  id: string;

  @Field({ description: 'Name der Kategorie' })
  name: string;

  @Field({ description: 'ID der Discord-Guild, zu der diese Kategorie gehört' })
  guildId: string;

  @Field({ nullable: true, description: 'Discord-ID der Kategorie' })
  discordCategoryId?: string;
}

/**
 * Input-Typ zum Erstellen einer neuen Kategorie.
 */
@InputType({ description: 'Eingabedaten zum Erstellen einer Kategorie' })
export class CreateCategoryInput {
  @Field({ description: 'ID der Discord-Guild, zu der diese Kategorie gehört' })
  guildId: string;

  @Field({ description: 'Name der Kategorie' })
  name: string;

  @Field({ defaultValue: 'default', description: 'Typ der Kategorie' })
  categoryType?: string;

  @Field({ defaultValue: true, description: 'Gibt an, ob die Kategorie sichtbar ist' })
  isVisible?: boolean;

  @Field({ defaultValue: false, description: 'Gibt an, ob Tracking für diese Kategorie aktiviert ist' })
  isTrackingActive?: boolean;

  @Field({ defaultValue: false, description: 'Gibt an, ob Setup-Nachrichten gesendet werden sollen' })
  isSendSetup?: boolean;

  @Field(() => [String], { nullable: true, description: 'Rollen, die auf diese Kategorie zugreifen dürfen' })
  allowedRoles?: string[];

  @Field({ nullable: true, description: 'Discord-ID der Kategorie' })
  discordCategoryId?: string;

  @Field({ defaultValue: false, description: 'Gibt an, ob die Kategorie in Discord gelöscht wurde' })
  isDeletedInDiscord?: boolean;
}

/**
 * Input-Typ zum Aktualisieren einer existierenden Kategorie.
 */
@InputType({ description: 'Eingabedaten zum Aktualisieren einer Kategorie' })
export class UpdateCategoryInput {
  @Field(() => ID, { description: 'ID der zu aktualisierenden Kategorie' })
  id: string;

  @Field({ nullable: true, description: 'ID der Discord-Guild, zu der diese Kategorie gehört' })
  guildId?: string;

  @Field({ nullable: true, description: 'Name der Kategorie' })
  name?: string;

  @Field({ nullable: true, description: 'Typ der Kategorie' })
  categoryType?: string;

  @Field({ nullable: true, description: 'Gibt an, ob die Kategorie sichtbar ist' })
  isVisible?: boolean;

  @Field({ nullable: true, description: 'Gibt an, ob Tracking für diese Kategorie aktiviert ist' })
  isTrackingActive?: boolean;

  @Field({ nullable: true, description: 'Gibt an, ob Setup-Nachrichten gesendet werden sollen' })
  isSendSetup?: boolean;

  @Field(() => [String], { nullable: true, description: 'Rollen, die auf diese Kategorie zugreifen dürfen' })
  allowedRoles?: string[];

  @Field({ nullable: true, description: 'Discord-ID der Kategorie' })
  discordCategoryId?: string;

  @Field({ nullable: true, description: 'Gibt an, ob die Kategorie in Discord gelöscht wurde' })
  isDeletedInDiscord?: boolean;
}

/**
 * Generisches Event-Payload für Kategorie-Events
 */
@ObjectType({ description: 'Generisches Event-Payload für Kategorie-Events' })
export class CategoryEvent {
  @Field(() => ID, { description: 'ID der Kategorie' })
  id: string;

  @Field({ description: 'ID der Discord-Guild' })
  guildId: string;

  @Field({ description: 'Name der Kategorie' })
  name: string;

  @Field({ nullable: true, description: 'Discord-ID der Kategorie' })
  discordCategoryId?: string;

  @Field({ description: 'Zeitstempel des Events' })
  timestamp: string;

  @Field({ description: 'Typ des Events (created, updated, deleted, etc.)' })
  eventType: string;

  @Field({ nullable: true, description: 'Optionale Fehlermeldung' })
  error?: string;

  @Field({ nullable: true, description: 'Optionale Zusatzinformationen als JSON-String' })
  details?: string;
}

/**
 * Definition für Erfolgreiche Mutationen
 */
@ObjectType({ description: 'Basisklasse für Mutations-Ergebnisse' })
export class MutationResult {
  @Field({ description: 'Gibt an, ob die Operation erfolgreich war' })
  success: boolean;

  @Field({ nullable: true, description: 'Optionale Nachricht zum Ergebnis' })
  message?: string;
}

/**
 * Interface für den Category-Cache (nicht GraphQL)
 */
export interface CategoryCache {
  firstUpdateTime: number;
  lastUpdateTime: number;
  changeCount: number;
  cachedName: string;
}