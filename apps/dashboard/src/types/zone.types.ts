// Zonen-Typdefinitionen für die Supabase-Integration

export interface Zone {
  id: string;
  name: string;
  server_id: string;
  category_id: string;
  zone_type: string;
  allowed_roles: string[];
  is_private: boolean;
  is_visible: boolean;
  is_moderated: boolean;
  is_tracking_enabled: boolean;
  created_at: string;
  updated_at: string;
  discord_id?: string;
  discord_position?: number;
}

export interface CreateZoneInput {
  name: string;
  server_id: string;
  category_id: string;
  zone_type: string;
  allowed_roles: string[];
  is_private: boolean;
  is_visible: boolean;
  is_moderated: boolean;
  is_tracking_enabled: boolean;
  discord_position?: number; // Optional discord_position
}

export interface UpdateZoneInput {
  name?: string;
  category_id?: string;
  zone_type?: string;
  allowed_roles?: string[];
  is_private?: boolean;
  is_visible?: boolean;
  is_moderated?: boolean;
  is_tracking_enabled?: boolean;
  discord_position?: number;
}

// ZoneFormData wird für Formulare verwendet
export interface ZoneFormData {
  name: string;
  category_id: string;
  zone_type: string;
  allowed_roles: string[];
  is_private?: boolean;
  is_visible?: boolean;
  is_moderated?: boolean;
  is_tracking_enabled?: boolean;
  server_id?: string;
}
