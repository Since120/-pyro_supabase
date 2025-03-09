// Rolle-Typdefinitionen für die Supabase-Integration

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  isHoist: boolean;
  position: number;
  permissions: string;
  isManaged: boolean;
  isMentionable: boolean;
  icon?: string | null;
  unicodeEmoji?: string | null;
  createdTimestamp: number;
  createdAt: string;
  tags?: DiscordRoleTags | null;
}

export interface DiscordRoleTags {
  botId?: string | null;
  isPremiumSubscriberRole?: boolean | null;
  integrationId?: string | null;
}

export interface DiscordRoleFilter {
  name?: string;
  isManaged?: boolean;
  isMentionable?: boolean;
}
