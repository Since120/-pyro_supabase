import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { GraphQLContext } from '../context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
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

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Category: ResolverTypeWrapper<Category>;
  CategoryEvent: ResolverTypeWrapper<CategoryEvent>;
  ChannelEvent: ResolverTypeWrapper<ChannelEvent>;
  CreateCategoryInput: CreateCategoryInput;
  DiscordChannel: ResolverTypeWrapper<DiscordChannel>;
  DiscordChannelFilter: DiscordChannelFilter;
  DiscordRole: ResolverTypeWrapper<DiscordRole>;
  DiscordRoleFilter: DiscordRoleFilter;
  DiscordRoleTags: ResolverTypeWrapper<DiscordRoleTags>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  MutationResult: ResolverTypeWrapper<MutationResult>;
  Query: ResolverTypeWrapper<{}>;
  RoleEvent: ResolverTypeWrapper<RoleEvent>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  Timestamp: ResolverTypeWrapper<Scalars['Timestamp']['output']>;
  UpdateCategoryInput: UpdateCategoryInput;
  Zone: ResolverTypeWrapper<Zone>;
  ZoneCreateInput: ZoneCreateInput;
  ZoneEvent: ResolverTypeWrapper<ZoneEvent>;
  ZoneUpdateInput: ZoneUpdateInput;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Boolean: Scalars['Boolean']['output'];
  Category: Category;
  CategoryEvent: CategoryEvent;
  ChannelEvent: ChannelEvent;
  CreateCategoryInput: CreateCategoryInput;
  DiscordChannel: DiscordChannel;
  DiscordChannelFilter: DiscordChannelFilter;
  DiscordRole: DiscordRole;
  DiscordRoleFilter: DiscordRoleFilter;
  DiscordRoleTags: DiscordRoleTags;
  Float: Scalars['Float']['output'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Mutation: {};
  MutationResult: MutationResult;
  Query: {};
  RoleEvent: RoleEvent;
  String: Scalars['String']['output'];
  Subscription: {};
  Timestamp: Scalars['Timestamp']['output'];
  UpdateCategoryInput: UpdateCategoryInput;
  Zone: Zone;
  ZoneCreateInput: ZoneCreateInput;
  ZoneEvent: ZoneEvent;
  ZoneUpdateInput: ZoneUpdateInput;
}>;

export type CategoryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Category'] = ResolversParentTypes['Category']> = ResolversObject<{
  allowedRoles?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  categoryType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  discordCategoryId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  guildId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isDeletedInDiscord?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isSendSetup?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isTrackingActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isVisible?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lastUsageAt?: Resolver<Maybe<ResolversTypes['Timestamp']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalSecondsInCategory?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CategoryEventResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CategoryEvent'] = ResolversParentTypes['CategoryEvent']> = ResolversObject<{
  details?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  discordCategoryId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  eventType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  guildId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ChannelEventResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ChannelEvent'] = ResolversParentTypes['ChannelEvent']> = ResolversObject<{
  channelId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  channels?: Resolver<Maybe<Array<ResolversTypes['DiscordChannel']>>, ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  eventType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  guildId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requestId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DiscordChannelResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DiscordChannel'] = ResolversParentTypes['DiscordChannel']> = ResolversObject<{
  guildId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  parentId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  position?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DiscordRoleResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DiscordRole'] = ResolversParentTypes['DiscordRole']> = ResolversObject<{
  color?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdTimestamp?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isHoist?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isManaged?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isMentionable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  permissions?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  position?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  tags?: Resolver<Maybe<ResolversTypes['DiscordRoleTags']>, ParentType, ContextType>;
  unicodeEmoji?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DiscordRoleTagsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DiscordRoleTags'] = ResolversParentTypes['DiscordRoleTags']> = ResolversObject<{
  botId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  integrationId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  isPremiumSubscriberRole?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  categoryReceivedFromBot?: Resolver<ResolversTypes['MutationResult'], ParentType, ContextType, RequireFields<MutationCategoryReceivedFromBotArgs, 'discordCategoryId' | 'id'>>;
  createCategory?: Resolver<ResolversTypes['Category'], ParentType, ContextType, RequireFields<MutationCreateCategoryArgs, 'input'>>;
  createZone?: Resolver<ResolversTypes['Zone'], ParentType, ContextType, RequireFields<MutationCreateZoneArgs, 'input'>>;
  deleteCategory?: Resolver<ResolversTypes['Category'], ParentType, ContextType, RequireFields<MutationDeleteCategoryArgs, 'id'>>;
  deleteZone?: Resolver<ResolversTypes['Zone'], ParentType, ContextType, RequireFields<MutationDeleteZoneArgs, 'id'>>;
  updateCategory?: Resolver<ResolversTypes['Category'], ParentType, ContextType, RequireFields<MutationUpdateCategoryArgs, 'id' | 'input'>>;
  updateZone?: Resolver<ResolversTypes['Zone'], ParentType, ContextType, RequireFields<MutationUpdateZoneArgs, 'id' | 'input'>>;
}>;

export type MutationResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MutationResult'] = ResolversParentTypes['MutationResult']> = ResolversObject<{
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  categories?: Resolver<Array<ResolversTypes['Category']>, ParentType, ContextType>;
  discordChannelById?: Resolver<ResolversTypes['DiscordChannel'], ParentType, ContextType, RequireFields<QueryDiscordChannelByIdArgs, 'channelId' | 'guildId'>>;
  discordChannels?: Resolver<Array<ResolversTypes['DiscordChannel']>, ParentType, ContextType>;
  discordChannelsByGuild?: Resolver<Array<ResolversTypes['DiscordChannel']>, ParentType, ContextType, RequireFields<QueryDiscordChannelsByGuildArgs, 'guildId'>>;
  discordRoles?: Resolver<Array<ResolversTypes['DiscordRole']>, ParentType, ContextType>;
  discordRolesByGuild?: Resolver<Array<ResolversTypes['DiscordRole']>, ParentType, ContextType, RequireFields<QueryDiscordRolesByGuildArgs, 'guildId'>>;
  tempQuery?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  zone?: Resolver<ResolversTypes['Zone'], ParentType, ContextType, RequireFields<QueryZoneArgs, 'id'>>;
  zones?: Resolver<Array<ResolversTypes['Zone']>, ParentType, ContextType>;
}>;

export type RoleEventResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RoleEvent'] = ResolversParentTypes['RoleEvent']> = ResolversObject<{
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  eventType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  guildId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requestId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  roles?: Resolver<Maybe<Array<ResolversTypes['DiscordRole']>>, ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SubscriptionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = ResolversObject<{
  categoryEvent?: SubscriptionResolver<ResolversTypes['CategoryEvent'], "categoryEvent", ParentType, ContextType>;
  channelEvent?: SubscriptionResolver<ResolversTypes['ChannelEvent'], "channelEvent", ParentType, ContextType>;
  roleEvent?: SubscriptionResolver<ResolversTypes['RoleEvent'], "roleEvent", ParentType, ContextType>;
  zoneEvent?: SubscriptionResolver<Maybe<ResolversTypes['ZoneEvent']>, "zoneEvent", ParentType, ContextType>;
}>;

export interface TimestampScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Timestamp'], any> {
  name: 'Timestamp';
}

export type ZoneResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Zone'] = ResolversParentTypes['Zone']> = ResolversObject<{
  category?: Resolver<ResolversTypes['Category'], ParentType, ContextType>;
  categoryId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  discordVoiceId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isDeletedInDiscord?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lastUsageAt?: Resolver<Maybe<ResolversTypes['Timestamp']>, ParentType, ContextType>;
  minutesRequired?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pointsGranted?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  totalSecondsInZone?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  zoneKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ZoneEventResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ZoneEvent'] = ResolversParentTypes['ZoneEvent']> = ResolversObject<{
  categoryId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  details?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  discordCategoryId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  discordVoiceId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  eventType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timestamp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = GraphQLContext> = ResolversObject<{
  Category?: CategoryResolvers<ContextType>;
  CategoryEvent?: CategoryEventResolvers<ContextType>;
  ChannelEvent?: ChannelEventResolvers<ContextType>;
  DiscordChannel?: DiscordChannelResolvers<ContextType>;
  DiscordRole?: DiscordRoleResolvers<ContextType>;
  DiscordRoleTags?: DiscordRoleTagsResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  MutationResult?: MutationResultResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RoleEvent?: RoleEventResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Timestamp?: GraphQLScalarType;
  Zone?: ZoneResolvers<ContextType>;
  ZoneEvent?: ZoneEventResolvers<ContextType>;
}>;

