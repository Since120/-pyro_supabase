import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** `Date` type as integer. Type represents date and time as number of milliseconds from start of UNIX epoch. */
  Timestamp: { input: Date; output: Date; }
};

/** Repräsentiert eine Kategorie im System */
export type Category = {
  __typename?: 'Category';
  /** Rollen, die auf diese Kategorie zugreifen dürfen */
  allowedRoles: Array<Scalars['String']['output']>;
  /** Typ der Kategorie */
  categoryType: Scalars['String']['output'];
  /** Erstellungszeitpunkt der Kategorie */
  createdAt: Scalars['Timestamp']['output'];
  /** Discord-ID der Kategorie */
  discordCategoryId?: Maybe<Scalars['String']['output']>;
  /** ID der Discord-Guild, zu der diese Kategorie gehört */
  guildId: Scalars['String']['output'];
  /** Eindeutige ID der Kategorie */
  id: Scalars['ID']['output'];
  /** Gibt an, ob die Kategorie in Discord gelöscht wurde */
  isDeletedInDiscord: Scalars['Boolean']['output'];
  /** Gibt an, ob Setup-Nachrichten gesendet werden sollen */
  isSendSetup: Scalars['Boolean']['output'];
  /** Gibt an, ob Tracking für diese Kategorie aktiviert ist */
  isTrackingActive: Scalars['Boolean']['output'];
  /** Gibt an, ob die Kategorie sichtbar ist */
  isVisible: Scalars['Boolean']['output'];
  /** Letzte Nutzung der Kategorie */
  lastUsageAt?: Maybe<Scalars['Timestamp']['output']>;
  /** Name der Kategorie */
  name: Scalars['String']['output'];
  /** Gesamtzeit in Sekunden, die in dieser Kategorie verbracht wurde */
  totalSecondsInCategory: Scalars['Float']['output'];
  /** Letzter Aktualisierungszeitpunkt der Kategorie */
  updatedAt: Scalars['Timestamp']['output'];
};

/** Generisches Event-Payload für Kategorie-Events */
export type CategoryEvent = {
  __typename?: 'CategoryEvent';
  /** Optionale Zusatzinformationen als JSON-String */
  details?: Maybe<Scalars['String']['output']>;
  /** Discord-ID der Kategorie */
  discordCategoryId?: Maybe<Scalars['String']['output']>;
  /** Optionale Fehlermeldung */
  error?: Maybe<Scalars['String']['output']>;
  /** Typ des Events (created, updated, deleted, etc.) */
  eventType: Scalars['String']['output'];
  /** ID der Discord-Guild */
  guildId: Scalars['String']['output'];
  /** ID der Kategorie */
  id: Scalars['ID']['output'];
  /** Name der Kategorie */
  name: Scalars['String']['output'];
  /** Zeitstempel des Events */
  timestamp: Scalars['String']['output'];
};

/** Standard Channel Event Payload */
export type ChannelEvent = {
  __typename?: 'ChannelEvent';
  /** Discord Channel ID bei spezifischen Events */
  channelId?: Maybe<Scalars['String']['output']>;
  /** Liste der Discord-Channels */
  channels?: Maybe<Array<DiscordChannel>>;
  /** Fehlermeldung, falls die Anfrage fehlgeschlagen ist */
  error?: Maybe<Scalars['String']['output']>;
  /** Event Typ: request, response, error, created, updated, deleted, usw. */
  eventType: Scalars['String']['output'];
  /** ID der Discord-Guild, für die Channels angefordert werden */
  guildId: Scalars['String']['output'];
  /** ID der Anfrage für die Nachverfolgung */
  requestId: Scalars['String']['output'];
  /** Event Zeitstempel */
  timestamp: Scalars['String']['output'];
};

/** Eingabedaten zum Erstellen einer Kategorie */
export type CreateCategoryInput = {
  /** Rollen, die auf diese Kategorie zugreifen dürfen */
  allowedRoles?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Typ der Kategorie */
  categoryType?: Scalars['String']['input'];
  /** Discord-ID der Kategorie */
  discordCategoryId?: InputMaybe<Scalars['String']['input']>;
  /** ID der Discord-Guild, zu der diese Kategorie gehört */
  guildId: Scalars['String']['input'];
  /** Gibt an, ob die Kategorie in Discord gelöscht wurde */
  isDeletedInDiscord?: Scalars['Boolean']['input'];
  /** Gibt an, ob Setup-Nachrichten gesendet werden sollen */
  isSendSetup?: Scalars['Boolean']['input'];
  /** Gibt an, ob Tracking für diese Kategorie aktiviert ist */
  isTrackingActive?: Scalars['Boolean']['input'];
  /** Gibt an, ob die Kategorie sichtbar ist */
  isVisible?: Scalars['Boolean']['input'];
  /** Name der Kategorie */
  name: Scalars['String']['input'];
};

/** Repräsentiert einen Discord-Channel */
export type DiscordChannel = {
  __typename?: 'DiscordChannel';
  /** ID der Guild, zu der dieser Channel gehört */
  guildId: Scalars['String']['output'];
  /** Eindeutige ID des Discord-Channels */
  id: Scalars['ID']['output'];
  /** Name des Channels */
  name: Scalars['String']['output'];
  /** ID der übergeordneten Kategorie */
  parentId?: Maybe<Scalars['String']['output']>;
  /** Position des Channels in der Liste */
  position: Scalars['Float']['output'];
  /** Typ des Channels */
  type: Scalars['String']['output'];
};

/** Filter für Discord-Channels */
export type DiscordChannelFilter = {
  /** Nach Channelnamen filtern */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Nach übergeordneter Kategorie filtern */
  parentId?: InputMaybe<Scalars['String']['input']>;
  /** Nach Channeltyp filtern */
  type?: InputMaybe<Scalars['String']['input']>;
};

/** Repräsentiert eine Discord-Rolle */
export type DiscordRole = {
  __typename?: 'DiscordRole';
  /** Farbcode der Rolle als Ganzzahl */
  color: Scalars['Int']['output'];
  /** Erstellungsdatum der Rolle als ISO-String */
  createdAt: Scalars['String']['output'];
  /** Erstellungszeitstempel der Rolle in Unix-Zeit */
  createdTimestamp: Scalars['Float']['output'];
  /** Icon der Rolle */
  icon?: Maybe<Scalars['String']['output']>;
  /** Eindeutige ID der Discord-Rolle */
  id: Scalars['ID']['output'];
  /** Gibt an, ob die Rolle in der Mitgliederliste getrennt angezeigt wird */
  isHoist: Scalars['Boolean']['output'];
  /** Gibt an, ob die Rolle von Discord verwaltet wird */
  isManaged: Scalars['Boolean']['output'];
  /** Gibt an, ob die Rolle erwähnbar ist */
  isMentionable: Scalars['Boolean']['output'];
  /** Name der Rolle */
  name: Scalars['String']['output'];
  /** Berechtigungen der Rolle als Bitmaske */
  permissions: Scalars['String']['output'];
  /** Position der Rolle in der Rollenliste */
  position: Scalars['Int']['output'];
  /** Zusätzliche Tags der Rolle */
  tags?: Maybe<DiscordRoleTags>;
  /** Unicode-Emoji der Rolle */
  unicodeEmoji?: Maybe<Scalars['String']['output']>;
};

/** Filter für Discord-Rollen */
export type DiscordRoleFilter = {
  /** Nur von Discord verwaltete Rollen anzeigen */
  isManaged?: InputMaybe<Scalars['Boolean']['input']>;
  /** Nur erwähnbare Rollen anzeigen */
  isMentionable?: InputMaybe<Scalars['Boolean']['input']>;
  /** Nach Rollennamen filtern */
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Tags für Discord-Rollen */
export type DiscordRoleTags = {
  __typename?: 'DiscordRoleTags';
  /** ID des Bots, der die Rolle erstellt hat */
  botId?: Maybe<Scalars['ID']['output']>;
  /** ID der Integration, die die Rolle erstellt hat */
  integrationId?: Maybe<Scalars['ID']['output']>;
  /** Gibt an, ob es sich um eine Premium-Abonnenten-Rolle handelt */
  isPremiumSubscriberRole?: Maybe<Scalars['Boolean']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Aktualisiert die Discord-Kategorie-ID */
  categoryReceivedFromBot: MutationResult;
  /** Erstellt eine neue Kategorie */
  createCategory: Category;
  /** Erstellt eine neue Zone */
  createZone: Zone;
  /** Löscht eine Kategorie */
  deleteCategory: Category;
  /** Löscht eine Zone */
  deleteZone: Zone;
  /** Aktualisiert eine existierende Kategorie */
  updateCategory: Category;
  /** Aktualisiert eine existierende Zone */
  updateZone: Zone;
};


export type MutationCategoryReceivedFromBotArgs = {
  discordCategoryId: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationCreateCategoryArgs = {
  input: CreateCategoryInput;
};


export type MutationCreateZoneArgs = {
  input: ZoneCreateInput;
};


export type MutationDeleteCategoryArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteZoneArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateCategoryArgs = {
  id: Scalars['ID']['input'];
  input: UpdateCategoryInput;
};


export type MutationUpdateZoneArgs = {
  id: Scalars['ID']['input'];
  input: ZoneUpdateInput;
};

/** Basisklasse für Mutations-Ergebnisse */
export type MutationResult = {
  __typename?: 'MutationResult';
  /** Optionale Nachricht zum Ergebnis */
  message?: Maybe<Scalars['String']['output']>;
  /** Gibt an, ob die Operation erfolgreich war */
  success: Scalars['Boolean']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** Gibt alle Kategorien zurück */
  categories: Array<Category>;
  /** Gibt einen Discord-Channel anhand seiner ID zurück */
  discordChannelById: DiscordChannel;
  /** Gibt alle Discord-Channels für die Standardguild zurück */
  discordChannels: Array<DiscordChannel>;
  /** Gibt Discord-Channels für eine bestimmte Guild zurück */
  discordChannelsByGuild: Array<DiscordChannel>;
  /** Gibt alle Discord-Rollen für die Standardguild zurück */
  discordRoles: Array<DiscordRole>;
  /** Gibt Discord-Rollen für eine bestimmte Guild zurück */
  discordRolesByGuild: Array<DiscordRole>;
  /** Temporary root query */
  tempQuery: Scalars['String']['output'];
  /** Gibt eine einzelne Zone anhand ihrer ID zurück */
  zone: Zone;
  /** Gibt alle Zonen zurück */
  zones: Array<Zone>;
};


export type QueryDiscordChannelByIdArgs = {
  channelId: Scalars['ID']['input'];
  guildId: Scalars['String']['input'];
};


export type QueryDiscordChannelsByGuildArgs = {
  filter?: InputMaybe<DiscordChannelFilter>;
  guildId: Scalars['String']['input'];
};


export type QueryDiscordRolesByGuildArgs = {
  filter?: InputMaybe<DiscordRoleFilter>;
  guildId: Scalars['String']['input'];
};


export type QueryZoneArgs = {
  id: Scalars['ID']['input'];
};

/** Standard Discord Role Event Payload */
export type RoleEvent = {
  __typename?: 'RoleEvent';
  /** Fehlermeldung, falls die Anfrage fehlgeschlagen ist */
  error?: Maybe<Scalars['String']['output']>;
  /** Event Typ: request, response, error, usw. */
  eventType: Scalars['String']['output'];
  /** ID der Discord-Guild, für die Rollen angefordert werden */
  guildId: Scalars['String']['output'];
  /** ID der Anfrage für die Nachverfolgung */
  requestId: Scalars['String']['output'];
  /** Liste der Discord-Rollen */
  roles?: Maybe<Array<DiscordRole>>;
  /** Event Zeitstempel */
  timestamp: Scalars['String']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  /** Abonniere alle Kategorie-Events */
  categoryEvent: CategoryEvent;
  /** Abonniere alle Discord-Channel Events */
  channelEvent: ChannelEvent;
  /** Abonniere alle Discord-Rollen Events */
  roleEvent: RoleEvent;
  /** Abonniere alle Zone-Events */
  zoneEvent?: Maybe<ZoneEvent>;
};

/** Eingabedaten zum Aktualisieren einer Kategorie */
export type UpdateCategoryInput = {
  /** Rollen, die auf diese Kategorie zugreifen dürfen */
  allowedRoles?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Typ der Kategorie */
  categoryType?: InputMaybe<Scalars['String']['input']>;
  /** Discord-ID der Kategorie */
  discordCategoryId?: InputMaybe<Scalars['String']['input']>;
  /** ID der Discord-Guild, zu der diese Kategorie gehört */
  guildId?: InputMaybe<Scalars['String']['input']>;
  /** ID der zu aktualisierenden Kategorie */
  id: Scalars['ID']['input'];
  /** Gibt an, ob die Kategorie in Discord gelöscht wurde */
  isDeletedInDiscord?: InputMaybe<Scalars['Boolean']['input']>;
  /** Gibt an, ob Setup-Nachrichten gesendet werden sollen */
  isSendSetup?: InputMaybe<Scalars['Boolean']['input']>;
  /** Gibt an, ob Tracking für diese Kategorie aktiviert ist */
  isTrackingActive?: InputMaybe<Scalars['Boolean']['input']>;
  /** Gibt an, ob die Kategorie sichtbar ist */
  isVisible?: InputMaybe<Scalars['Boolean']['input']>;
  /** Name der Kategorie */
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Discord-Zone Repräsentation */
export type Zone = {
  __typename?: 'Zone';
  /** Die übergeordnete Kategorie dieser Zone */
  category: Category;
  /** ID der Kategorie, zu der diese Zone gehört */
  categoryId: Scalars['String']['output'];
  /** Erstellungszeitpunkt der Zone */
  createdAt: Scalars['Timestamp']['output'];
  /** Discord Voice Channel ID der Zone */
  discordVoiceId?: Maybe<Scalars['String']['output']>;
  /** Eindeutige Zone ID */
  id: Scalars['ID']['output'];
  /** Gibt an, ob die Zone in Discord gelöscht wurde */
  isDeletedInDiscord: Scalars['Boolean']['output'];
  /** Zeitpunkt der letzten Nutzung der Zone */
  lastUsageAt?: Maybe<Scalars['Timestamp']['output']>;
  /** Anzahl der Minuten, die in der Zone verbracht werden müssen, um Punkte zu erhalten */
  minutesRequired: Scalars['Float']['output'];
  /** Name der Zone */
  name: Scalars['String']['output'];
  /** Anzahl der Punkte, die für das Erreichen der erforderlichen Zeit vergeben werden */
  pointsGranted: Scalars['Float']['output'];
  /** Gesamtzeit in Sekunden, die in dieser Zone verbracht wurde */
  totalSecondsInZone: Scalars['Float']['output'];
  /** Letzter Aktualisierungszeitpunkt der Zone */
  updatedAt: Scalars['Timestamp']['output'];
  /** Kurzes Kürzel für die Zone, z.B. "CZ" für Contested Zone */
  zoneKey: Scalars['String']['output'];
};

/** Eingabedaten zum Erstellen einer Zone */
export type ZoneCreateInput = {
  /** ID der Kategorie, zu der diese Zone gehört */
  categoryId: Scalars['String']['input'];
  /** Discord Voice Channel ID der Zone */
  discordVoiceId?: InputMaybe<Scalars['String']['input']>;
  /** Gibt an, ob die Zone in Discord gelöscht wurde */
  isDeletedInDiscord?: Scalars['Boolean']['input'];
  /** Zeitpunkt der letzten Nutzung */
  lastUsageAt?: InputMaybe<Scalars['Timestamp']['input']>;
  /** Anzahl der Minuten, die in der Zone verbracht werden müssen */
  minutesRequired: Scalars['Float']['input'];
  /** Name der Zone */
  name: Scalars['String']['input'];
  /** Anzahl der Punkte, die vergeben werden */
  pointsGranted: Scalars['Float']['input'];
  /** Gesamtzeit in Sekunden in dieser Zone */
  totalSecondsInZone?: Scalars['Float']['input'];
  /** Kurzes Kürzel für die Zone */
  zoneKey: Scalars['String']['input'];
};

/** Generisches Event-Payload für Zone-Events */
export type ZoneEvent = {
  __typename?: 'ZoneEvent';
  categoryId?: Maybe<Scalars['String']['output']>;
  details?: Maybe<Scalars['String']['output']>;
  discordCategoryId?: Maybe<Scalars['String']['output']>;
  discordVoiceId?: Maybe<Scalars['String']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  eventType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  message?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['String']['output']>;
};

/** Eingabedaten zum Aktualisieren einer Zone */
export type ZoneUpdateInput = {
  /** ID der Kategorie, zu der diese Zone gehört */
  categoryId?: InputMaybe<Scalars['String']['input']>;
  /** Discord Voice Channel ID der Zone */
  discordVoiceId?: InputMaybe<Scalars['String']['input']>;
  /** Gibt an, ob die Zone in Discord gelöscht wurde */
  isDeletedInDiscord?: InputMaybe<Scalars['Boolean']['input']>;
  /** Zeitpunkt der letzten Nutzung */
  lastUsageAt?: InputMaybe<Scalars['Timestamp']['input']>;
  /** Anzahl der Minuten, die in der Zone verbracht werden müssen */
  minutesRequired?: InputMaybe<Scalars['Float']['input']>;
  /** Name der Zone */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Anzahl der Punkte, die vergeben werden */
  pointsGranted?: InputMaybe<Scalars['Float']['input']>;
  /** Gesamtzeit in Sekunden in dieser Zone */
  totalSecondsInZone?: InputMaybe<Scalars['Float']['input']>;
  /** Kurzes Kürzel für die Zone */
  zoneKey?: InputMaybe<Scalars['String']['input']>;
};

export type CreateCategoryMutationVariables = Exact<{
  input: CreateCategoryInput;
}>;


export type CreateCategoryMutation = { __typename?: 'Mutation', createCategory: { __typename?: 'Category', id: string, guildId: string, name: string, categoryType: string, isVisible: boolean, isTrackingActive: boolean, isSendSetup: boolean, allowedRoles: Array<string>, discordCategoryId?: string | null, isDeletedInDiscord: boolean, lastUsageAt?: Date | null, totalSecondsInCategory: number, createdAt: Date, updatedAt: Date } };

export type UpdateCategoryMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateCategoryInput;
}>;


export type UpdateCategoryMutation = { __typename?: 'Mutation', updateCategory: { __typename?: 'Category', id: string, guildId: string, name: string, categoryType: string, isVisible: boolean, isTrackingActive: boolean, isSendSetup: boolean, allowedRoles: Array<string>, discordCategoryId?: string | null, isDeletedInDiscord: boolean, lastUsageAt?: Date | null, totalSecondsInCategory: number, createdAt: Date, updatedAt: Date } };

export type DeleteCategoryMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteCategoryMutation = { __typename?: 'Mutation', deleteCategory: { __typename?: 'Category', id: string, name: string, discordCategoryId?: string | null } };

export type CategoryReceivedFromBotMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  discordCategoryId: Scalars['String']['input'];
}>;


export type CategoryReceivedFromBotMutation = { __typename?: 'Mutation', categoryReceivedFromBot: { __typename?: 'MutationResult', success: boolean, message?: string | null } };

export type CreateZoneMutationVariables = Exact<{
  input: ZoneCreateInput;
}>;


export type CreateZoneMutation = { __typename?: 'Mutation', createZone: { __typename?: 'Zone', id: string, zoneKey: string, name: string, minutesRequired: number, pointsGranted: number, lastUsageAt?: Date | null, totalSecondsInZone: number, isDeletedInDiscord: boolean, categoryId: string, discordVoiceId?: string | null, createdAt: Date, updatedAt: Date } };

export type UpdateZoneMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ZoneUpdateInput;
}>;


export type UpdateZoneMutation = { __typename?: 'Mutation', updateZone: { __typename?: 'Zone', id: string, zoneKey: string, name: string, minutesRequired: number, pointsGranted: number, lastUsageAt?: Date | null, totalSecondsInZone: number, isDeletedInDiscord: boolean, categoryId: string, discordVoiceId?: string | null, createdAt: Date, updatedAt: Date } };

export type DeleteZoneMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteZoneMutation = { __typename?: 'Mutation', deleteZone: { __typename?: 'Zone', id: string, name: string, discordVoiceId?: string | null } };

export type GetCategoriesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCategoriesQuery = { __typename?: 'Query', categories: Array<{ __typename?: 'Category', id: string, guildId: string, name: string, categoryType: string, isVisible: boolean, isTrackingActive: boolean, isSendSetup: boolean, allowedRoles: Array<string>, discordCategoryId?: string | null, isDeletedInDiscord: boolean, lastUsageAt?: Date | null, totalSecondsInCategory: number, createdAt: Date, updatedAt: Date }> };

export type GetDiscordRolesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDiscordRolesQuery = { __typename?: 'Query', discordRoles: Array<{ __typename?: 'DiscordRole', id: string, name: string, color: number, isHoist: boolean, position: number, permissions: string, isManaged: boolean, isMentionable: boolean, icon?: string | null, unicodeEmoji?: string | null, createdTimestamp: number, createdAt: string, tags?: { __typename?: 'DiscordRoleTags', botId?: string | null, isPremiumSubscriberRole?: boolean | null, integrationId?: string | null } | null }> };

export type GetDiscordRolesByGuildQueryVariables = Exact<{
  guildId: Scalars['String']['input'];
  filter?: InputMaybe<DiscordRoleFilter>;
}>;


export type GetDiscordRolesByGuildQuery = { __typename?: 'Query', discordRolesByGuild: Array<{ __typename?: 'DiscordRole', id: string, name: string, color: number, isHoist: boolean, position: number, permissions: string, isManaged: boolean, isMentionable: boolean, icon?: string | null, unicodeEmoji?: string | null, createdTimestamp: number, createdAt: string, tags?: { __typename?: 'DiscordRoleTags', botId?: string | null, isPremiumSubscriberRole?: boolean | null, integrationId?: string | null } | null }> };

export type GetZonesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetZonesQuery = { __typename?: 'Query', zones: Array<{ __typename?: 'Zone', id: string, zoneKey: string, name: string, minutesRequired: number, pointsGranted: number, lastUsageAt?: Date | null, totalSecondsInZone: number, isDeletedInDiscord: boolean, categoryId: string, discordVoiceId?: string | null, createdAt: Date, updatedAt: Date, category: { __typename?: 'Category', id: string, name: string, discordCategoryId?: string | null } }> };

export type GetZoneQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetZoneQuery = { __typename?: 'Query', zone: { __typename?: 'Zone', id: string, zoneKey: string, name: string, minutesRequired: number, pointsGranted: number, lastUsageAt?: Date | null, totalSecondsInZone: number, isDeletedInDiscord: boolean, categoryId: string, discordVoiceId?: string | null, createdAt: Date, updatedAt: Date, category: { __typename?: 'Category', id: string, name: string, discordCategoryId?: string | null } } };

export type CategoryEventSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type CategoryEventSubscription = { __typename?: 'Subscription', categoryEvent: { __typename?: 'CategoryEvent', id: string, guildId: string, name: string, discordCategoryId?: string | null, timestamp: string, eventType: string, error?: string | null, details?: string | null } };

export type RoleEventSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type RoleEventSubscription = { __typename?: 'Subscription', roleEvent: { __typename?: 'RoleEvent', requestId: string, guildId: string, timestamp: string, eventType: string, error?: string | null, roles?: Array<{ __typename?: 'DiscordRole', id: string, name: string, color: number, isHoist: boolean, position: number, permissions: string, isManaged: boolean, isMentionable: boolean }> | null } };

export type WatchZoneEventsSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type WatchZoneEventsSubscription = { __typename?: 'Subscription', zoneEvent?: { __typename?: 'ZoneEvent', id: string, categoryId?: string | null, name?: string | null, discordVoiceId?: string | null, discordCategoryId?: string | null, timestamp?: string | null, eventType: string, message?: string | null, error?: string | null, details?: string | null } | null };

export type ZoneEventSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type ZoneEventSubscription = { __typename?: 'Subscription', zoneEvent?: { __typename?: 'ZoneEvent', id: string, categoryId?: string | null, name?: string | null, discordVoiceId?: string | null, discordCategoryId?: string | null, timestamp?: string | null, eventType: string, message?: string | null, error?: string | null, details?: string | null } | null };


export const CreateCategoryDocument = gql`
    mutation CreateCategory($input: CreateCategoryInput!) {
  createCategory(input: $input) {
    id
    guildId
    name
    categoryType
    isVisible
    isTrackingActive
    isSendSetup
    allowedRoles
    discordCategoryId
    isDeletedInDiscord
    lastUsageAt
    totalSecondsInCategory
    createdAt
    updatedAt
  }
}
    `;
export type CreateCategoryMutationFn = Apollo.MutationFunction<CreateCategoryMutation, CreateCategoryMutationVariables>;

/**
 * __useCreateCategoryMutation__
 *
 * To run a mutation, you first call `useCreateCategoryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCategoryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCategoryMutation, { data, loading, error }] = useCreateCategoryMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateCategoryMutation(baseOptions?: Apollo.MutationHookOptions<CreateCategoryMutation, CreateCategoryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateCategoryMutation, CreateCategoryMutationVariables>(CreateCategoryDocument, options);
      }
export type CreateCategoryMutationHookResult = ReturnType<typeof useCreateCategoryMutation>;
export type CreateCategoryMutationResult = Apollo.MutationResult<CreateCategoryMutation>;
export type CreateCategoryMutationOptions = Apollo.BaseMutationOptions<CreateCategoryMutation, CreateCategoryMutationVariables>;
export const UpdateCategoryDocument = gql`
    mutation UpdateCategory($id: ID!, $input: UpdateCategoryInput!) {
  updateCategory(id: $id, input: $input) {
    id
    guildId
    name
    categoryType
    isVisible
    isTrackingActive
    isSendSetup
    allowedRoles
    discordCategoryId
    isDeletedInDiscord
    lastUsageAt
    totalSecondsInCategory
    createdAt
    updatedAt
  }
}
    `;
export type UpdateCategoryMutationFn = Apollo.MutationFunction<UpdateCategoryMutation, UpdateCategoryMutationVariables>;

/**
 * __useUpdateCategoryMutation__
 *
 * To run a mutation, you first call `useUpdateCategoryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateCategoryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateCategoryMutation, { data, loading, error }] = useUpdateCategoryMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateCategoryMutation(baseOptions?: Apollo.MutationHookOptions<UpdateCategoryMutation, UpdateCategoryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateCategoryMutation, UpdateCategoryMutationVariables>(UpdateCategoryDocument, options);
      }
export type UpdateCategoryMutationHookResult = ReturnType<typeof useUpdateCategoryMutation>;
export type UpdateCategoryMutationResult = Apollo.MutationResult<UpdateCategoryMutation>;
export type UpdateCategoryMutationOptions = Apollo.BaseMutationOptions<UpdateCategoryMutation, UpdateCategoryMutationVariables>;
export const DeleteCategoryDocument = gql`
    mutation DeleteCategory($id: ID!) {
  deleteCategory(id: $id) {
    id
    name
    discordCategoryId
  }
}
    `;
export type DeleteCategoryMutationFn = Apollo.MutationFunction<DeleteCategoryMutation, DeleteCategoryMutationVariables>;

/**
 * __useDeleteCategoryMutation__
 *
 * To run a mutation, you first call `useDeleteCategoryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteCategoryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteCategoryMutation, { data, loading, error }] = useDeleteCategoryMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteCategoryMutation(baseOptions?: Apollo.MutationHookOptions<DeleteCategoryMutation, DeleteCategoryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteCategoryMutation, DeleteCategoryMutationVariables>(DeleteCategoryDocument, options);
      }
export type DeleteCategoryMutationHookResult = ReturnType<typeof useDeleteCategoryMutation>;
export type DeleteCategoryMutationResult = Apollo.MutationResult<DeleteCategoryMutation>;
export type DeleteCategoryMutationOptions = Apollo.BaseMutationOptions<DeleteCategoryMutation, DeleteCategoryMutationVariables>;
export const CategoryReceivedFromBotDocument = gql`
    mutation CategoryReceivedFromBot($id: ID!, $discordCategoryId: String!) {
  categoryReceivedFromBot(id: $id, discordCategoryId: $discordCategoryId) {
    success
    message
  }
}
    `;
export type CategoryReceivedFromBotMutationFn = Apollo.MutationFunction<CategoryReceivedFromBotMutation, CategoryReceivedFromBotMutationVariables>;

/**
 * __useCategoryReceivedFromBotMutation__
 *
 * To run a mutation, you first call `useCategoryReceivedFromBotMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCategoryReceivedFromBotMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [categoryReceivedFromBotMutation, { data, loading, error }] = useCategoryReceivedFromBotMutation({
 *   variables: {
 *      id: // value for 'id'
 *      discordCategoryId: // value for 'discordCategoryId'
 *   },
 * });
 */
export function useCategoryReceivedFromBotMutation(baseOptions?: Apollo.MutationHookOptions<CategoryReceivedFromBotMutation, CategoryReceivedFromBotMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CategoryReceivedFromBotMutation, CategoryReceivedFromBotMutationVariables>(CategoryReceivedFromBotDocument, options);
      }
export type CategoryReceivedFromBotMutationHookResult = ReturnType<typeof useCategoryReceivedFromBotMutation>;
export type CategoryReceivedFromBotMutationResult = Apollo.MutationResult<CategoryReceivedFromBotMutation>;
export type CategoryReceivedFromBotMutationOptions = Apollo.BaseMutationOptions<CategoryReceivedFromBotMutation, CategoryReceivedFromBotMutationVariables>;
export const CreateZoneDocument = gql`
    mutation CreateZone($input: ZoneCreateInput!) {
  createZone(input: $input) {
    id
    zoneKey
    name
    minutesRequired
    pointsGranted
    lastUsageAt
    totalSecondsInZone
    isDeletedInDiscord
    categoryId
    discordVoiceId
    createdAt
    updatedAt
  }
}
    `;
export type CreateZoneMutationFn = Apollo.MutationFunction<CreateZoneMutation, CreateZoneMutationVariables>;

/**
 * __useCreateZoneMutation__
 *
 * To run a mutation, you first call `useCreateZoneMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateZoneMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createZoneMutation, { data, loading, error }] = useCreateZoneMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateZoneMutation(baseOptions?: Apollo.MutationHookOptions<CreateZoneMutation, CreateZoneMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateZoneMutation, CreateZoneMutationVariables>(CreateZoneDocument, options);
      }
export type CreateZoneMutationHookResult = ReturnType<typeof useCreateZoneMutation>;
export type CreateZoneMutationResult = Apollo.MutationResult<CreateZoneMutation>;
export type CreateZoneMutationOptions = Apollo.BaseMutationOptions<CreateZoneMutation, CreateZoneMutationVariables>;
export const UpdateZoneDocument = gql`
    mutation UpdateZone($id: ID!, $input: ZoneUpdateInput!) {
  updateZone(id: $id, input: $input) {
    id
    zoneKey
    name
    minutesRequired
    pointsGranted
    lastUsageAt
    totalSecondsInZone
    isDeletedInDiscord
    categoryId
    discordVoiceId
    createdAt
    updatedAt
  }
}
    `;
export type UpdateZoneMutationFn = Apollo.MutationFunction<UpdateZoneMutation, UpdateZoneMutationVariables>;

/**
 * __useUpdateZoneMutation__
 *
 * To run a mutation, you first call `useUpdateZoneMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateZoneMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateZoneMutation, { data, loading, error }] = useUpdateZoneMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateZoneMutation(baseOptions?: Apollo.MutationHookOptions<UpdateZoneMutation, UpdateZoneMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateZoneMutation, UpdateZoneMutationVariables>(UpdateZoneDocument, options);
      }
export type UpdateZoneMutationHookResult = ReturnType<typeof useUpdateZoneMutation>;
export type UpdateZoneMutationResult = Apollo.MutationResult<UpdateZoneMutation>;
export type UpdateZoneMutationOptions = Apollo.BaseMutationOptions<UpdateZoneMutation, UpdateZoneMutationVariables>;
export const DeleteZoneDocument = gql`
    mutation DeleteZone($id: ID!) {
  deleteZone(id: $id) {
    id
    name
    discordVoiceId
  }
}
    `;
export type DeleteZoneMutationFn = Apollo.MutationFunction<DeleteZoneMutation, DeleteZoneMutationVariables>;

/**
 * __useDeleteZoneMutation__
 *
 * To run a mutation, you first call `useDeleteZoneMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteZoneMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteZoneMutation, { data, loading, error }] = useDeleteZoneMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteZoneMutation(baseOptions?: Apollo.MutationHookOptions<DeleteZoneMutation, DeleteZoneMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteZoneMutation, DeleteZoneMutationVariables>(DeleteZoneDocument, options);
      }
export type DeleteZoneMutationHookResult = ReturnType<typeof useDeleteZoneMutation>;
export type DeleteZoneMutationResult = Apollo.MutationResult<DeleteZoneMutation>;
export type DeleteZoneMutationOptions = Apollo.BaseMutationOptions<DeleteZoneMutation, DeleteZoneMutationVariables>;
export const GetCategoriesDocument = gql`
    query GetCategories {
  categories {
    id
    guildId
    name
    categoryType
    isVisible
    isTrackingActive
    isSendSetup
    allowedRoles
    discordCategoryId
    isDeletedInDiscord
    lastUsageAt
    totalSecondsInCategory
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useGetCategoriesQuery__
 *
 * To run a query within a React component, call `useGetCategoriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCategoriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCategoriesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetCategoriesQuery(baseOptions?: Apollo.QueryHookOptions<GetCategoriesQuery, GetCategoriesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCategoriesQuery, GetCategoriesQueryVariables>(GetCategoriesDocument, options);
      }
export function useGetCategoriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCategoriesQuery, GetCategoriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCategoriesQuery, GetCategoriesQueryVariables>(GetCategoriesDocument, options);
        }
export function useGetCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetCategoriesQuery, GetCategoriesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetCategoriesQuery, GetCategoriesQueryVariables>(GetCategoriesDocument, options);
        }
export type GetCategoriesQueryHookResult = ReturnType<typeof useGetCategoriesQuery>;
export type GetCategoriesLazyQueryHookResult = ReturnType<typeof useGetCategoriesLazyQuery>;
export type GetCategoriesSuspenseQueryHookResult = ReturnType<typeof useGetCategoriesSuspenseQuery>;
export type GetCategoriesQueryResult = Apollo.QueryResult<GetCategoriesQuery, GetCategoriesQueryVariables>;
export const GetDiscordRolesDocument = gql`
    query GetDiscordRoles {
  discordRoles {
    id
    name
    color
    isHoist
    position
    permissions
    isManaged
    isMentionable
    icon
    unicodeEmoji
    createdTimestamp
    createdAt
    tags {
      botId
      isPremiumSubscriberRole
      integrationId
    }
  }
}
    `;

/**
 * __useGetDiscordRolesQuery__
 *
 * To run a query within a React component, call `useGetDiscordRolesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDiscordRolesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDiscordRolesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetDiscordRolesQuery(baseOptions?: Apollo.QueryHookOptions<GetDiscordRolesQuery, GetDiscordRolesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDiscordRolesQuery, GetDiscordRolesQueryVariables>(GetDiscordRolesDocument, options);
      }
export function useGetDiscordRolesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDiscordRolesQuery, GetDiscordRolesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDiscordRolesQuery, GetDiscordRolesQueryVariables>(GetDiscordRolesDocument, options);
        }
export function useGetDiscordRolesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDiscordRolesQuery, GetDiscordRolesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDiscordRolesQuery, GetDiscordRolesQueryVariables>(GetDiscordRolesDocument, options);
        }
export type GetDiscordRolesQueryHookResult = ReturnType<typeof useGetDiscordRolesQuery>;
export type GetDiscordRolesLazyQueryHookResult = ReturnType<typeof useGetDiscordRolesLazyQuery>;
export type GetDiscordRolesSuspenseQueryHookResult = ReturnType<typeof useGetDiscordRolesSuspenseQuery>;
export type GetDiscordRolesQueryResult = Apollo.QueryResult<GetDiscordRolesQuery, GetDiscordRolesQueryVariables>;
export const GetDiscordRolesByGuildDocument = gql`
    query GetDiscordRolesByGuild($guildId: String!, $filter: DiscordRoleFilter) {
  discordRolesByGuild(guildId: $guildId, filter: $filter) {
    id
    name
    color
    isHoist
    position
    permissions
    isManaged
    isMentionable
    icon
    unicodeEmoji
    createdTimestamp
    createdAt
    tags {
      botId
      isPremiumSubscriberRole
      integrationId
    }
  }
}
    `;

/**
 * __useGetDiscordRolesByGuildQuery__
 *
 * To run a query within a React component, call `useGetDiscordRolesByGuildQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDiscordRolesByGuildQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDiscordRolesByGuildQuery({
 *   variables: {
 *      guildId: // value for 'guildId'
 *      filter: // value for 'filter'
 *   },
 * });
 */
export function useGetDiscordRolesByGuildQuery(baseOptions: Apollo.QueryHookOptions<GetDiscordRolesByGuildQuery, GetDiscordRolesByGuildQueryVariables> & ({ variables: GetDiscordRolesByGuildQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDiscordRolesByGuildQuery, GetDiscordRolesByGuildQueryVariables>(GetDiscordRolesByGuildDocument, options);
      }
export function useGetDiscordRolesByGuildLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDiscordRolesByGuildQuery, GetDiscordRolesByGuildQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDiscordRolesByGuildQuery, GetDiscordRolesByGuildQueryVariables>(GetDiscordRolesByGuildDocument, options);
        }
export function useGetDiscordRolesByGuildSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDiscordRolesByGuildQuery, GetDiscordRolesByGuildQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDiscordRolesByGuildQuery, GetDiscordRolesByGuildQueryVariables>(GetDiscordRolesByGuildDocument, options);
        }
export type GetDiscordRolesByGuildQueryHookResult = ReturnType<typeof useGetDiscordRolesByGuildQuery>;
export type GetDiscordRolesByGuildLazyQueryHookResult = ReturnType<typeof useGetDiscordRolesByGuildLazyQuery>;
export type GetDiscordRolesByGuildSuspenseQueryHookResult = ReturnType<typeof useGetDiscordRolesByGuildSuspenseQuery>;
export type GetDiscordRolesByGuildQueryResult = Apollo.QueryResult<GetDiscordRolesByGuildQuery, GetDiscordRolesByGuildQueryVariables>;
export const GetZonesDocument = gql`
    query GetZones {
  zones {
    id
    zoneKey
    name
    minutesRequired
    pointsGranted
    lastUsageAt
    totalSecondsInZone
    isDeletedInDiscord
    categoryId
    discordVoiceId
    createdAt
    updatedAt
    category {
      id
      name
      discordCategoryId
    }
  }
}
    `;

/**
 * __useGetZonesQuery__
 *
 * To run a query within a React component, call `useGetZonesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetZonesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetZonesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetZonesQuery(baseOptions?: Apollo.QueryHookOptions<GetZonesQuery, GetZonesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetZonesQuery, GetZonesQueryVariables>(GetZonesDocument, options);
      }
export function useGetZonesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetZonesQuery, GetZonesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetZonesQuery, GetZonesQueryVariables>(GetZonesDocument, options);
        }
export function useGetZonesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetZonesQuery, GetZonesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetZonesQuery, GetZonesQueryVariables>(GetZonesDocument, options);
        }
export type GetZonesQueryHookResult = ReturnType<typeof useGetZonesQuery>;
export type GetZonesLazyQueryHookResult = ReturnType<typeof useGetZonesLazyQuery>;
export type GetZonesSuspenseQueryHookResult = ReturnType<typeof useGetZonesSuspenseQuery>;
export type GetZonesQueryResult = Apollo.QueryResult<GetZonesQuery, GetZonesQueryVariables>;
export const GetZoneDocument = gql`
    query GetZone($id: ID!) {
  zone(id: $id) {
    id
    zoneKey
    name
    minutesRequired
    pointsGranted
    lastUsageAt
    totalSecondsInZone
    isDeletedInDiscord
    categoryId
    discordVoiceId
    createdAt
    updatedAt
    category {
      id
      name
      discordCategoryId
    }
  }
}
    `;

/**
 * __useGetZoneQuery__
 *
 * To run a query within a React component, call `useGetZoneQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetZoneQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetZoneQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetZoneQuery(baseOptions: Apollo.QueryHookOptions<GetZoneQuery, GetZoneQueryVariables> & ({ variables: GetZoneQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetZoneQuery, GetZoneQueryVariables>(GetZoneDocument, options);
      }
export function useGetZoneLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetZoneQuery, GetZoneQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetZoneQuery, GetZoneQueryVariables>(GetZoneDocument, options);
        }
export function useGetZoneSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetZoneQuery, GetZoneQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetZoneQuery, GetZoneQueryVariables>(GetZoneDocument, options);
        }
export type GetZoneQueryHookResult = ReturnType<typeof useGetZoneQuery>;
export type GetZoneLazyQueryHookResult = ReturnType<typeof useGetZoneLazyQuery>;
export type GetZoneSuspenseQueryHookResult = ReturnType<typeof useGetZoneSuspenseQuery>;
export type GetZoneQueryResult = Apollo.QueryResult<GetZoneQuery, GetZoneQueryVariables>;
export const CategoryEventDocument = gql`
    subscription CategoryEvent {
  categoryEvent {
    id
    guildId
    name
    discordCategoryId
    timestamp
    eventType
    error
    details
  }
}
    `;

/**
 * __useCategoryEventSubscription__
 *
 * To run a query within a React component, call `useCategoryEventSubscription` and pass it any options that fit your needs.
 * When your component renders, `useCategoryEventSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCategoryEventSubscription({
 *   variables: {
 *   },
 * });
 */
export function useCategoryEventSubscription(baseOptions?: Apollo.SubscriptionHookOptions<CategoryEventSubscription, CategoryEventSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<CategoryEventSubscription, CategoryEventSubscriptionVariables>(CategoryEventDocument, options);
      }
export type CategoryEventSubscriptionHookResult = ReturnType<typeof useCategoryEventSubscription>;
export type CategoryEventSubscriptionResult = Apollo.SubscriptionResult<CategoryEventSubscription>;
export const RoleEventDocument = gql`
    subscription RoleEvent {
  roleEvent {
    requestId
    guildId
    roles {
      id
      name
      color
      isHoist
      position
      permissions
      isManaged
      isMentionable
    }
    timestamp
    eventType
    error
  }
}
    `;

/**
 * __useRoleEventSubscription__
 *
 * To run a query within a React component, call `useRoleEventSubscription` and pass it any options that fit your needs.
 * When your component renders, `useRoleEventSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRoleEventSubscription({
 *   variables: {
 *   },
 * });
 */
export function useRoleEventSubscription(baseOptions?: Apollo.SubscriptionHookOptions<RoleEventSubscription, RoleEventSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<RoleEventSubscription, RoleEventSubscriptionVariables>(RoleEventDocument, options);
      }
export type RoleEventSubscriptionHookResult = ReturnType<typeof useRoleEventSubscription>;
export type RoleEventSubscriptionResult = Apollo.SubscriptionResult<RoleEventSubscription>;
export const WatchZoneEventsDocument = gql`
    subscription WatchZoneEvents {
  zoneEvent {
    id
    categoryId
    name
    discordVoiceId
    discordCategoryId
    timestamp
    eventType
    message
    error
    details
  }
}
    `;

/**
 * __useWatchZoneEventsSubscription__
 *
 * To run a query within a React component, call `useWatchZoneEventsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useWatchZoneEventsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useWatchZoneEventsSubscription({
 *   variables: {
 *   },
 * });
 */
export function useWatchZoneEventsSubscription(baseOptions?: Apollo.SubscriptionHookOptions<WatchZoneEventsSubscription, WatchZoneEventsSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<WatchZoneEventsSubscription, WatchZoneEventsSubscriptionVariables>(WatchZoneEventsDocument, options);
      }
export type WatchZoneEventsSubscriptionHookResult = ReturnType<typeof useWatchZoneEventsSubscription>;
export type WatchZoneEventsSubscriptionResult = Apollo.SubscriptionResult<WatchZoneEventsSubscription>;
export const ZoneEventDocument = gql`
    subscription ZoneEvent {
  zoneEvent {
    id
    categoryId
    name
    discordVoiceId
    discordCategoryId
    timestamp
    eventType
    message
    error
    details
  }
}
    `;

/**
 * __useZoneEventSubscription__
 *
 * To run a query within a React component, call `useZoneEventSubscription` and pass it any options that fit your needs.
 * When your component renders, `useZoneEventSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useZoneEventSubscription({
 *   variables: {
 *   },
 * });
 */
export function useZoneEventSubscription(baseOptions?: Apollo.SubscriptionHookOptions<ZoneEventSubscription, ZoneEventSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<ZoneEventSubscription, ZoneEventSubscriptionVariables>(ZoneEventDocument, options);
      }
export type ZoneEventSubscriptionHookResult = ReturnType<typeof useZoneEventSubscription>;
export type ZoneEventSubscriptionResult = Apollo.SubscriptionResult<ZoneEventSubscription>;