// Kategorie-Typdefinitionen für die Supabase-Integration

export interface Category {
  id: string;
  name: string;
  server_id: string;
  allowed_roles: string[];
  category_type: string;
  is_visible: boolean;
  is_tracking_enabled: boolean;
  created_at: string;
  updated_at: string;
  discord_id?: string;
  discord_position?: number;
}

export interface CreateCategoryInput {
  name: string;
  server_id: string;
  category_type: string;
  allowed_roles: string[];
  is_visible: boolean;
  is_tracking_enabled: boolean;
  send_setup?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  allowed_roles?: string[];
  category_type?: string;
  is_visible?: boolean;
  is_tracking_enabled?: boolean;
}

// CategoryFormData wird für Formulare verwendet
export interface CategoryFormData {
  name: string;
  category_type: string;
  allowed_roles: string[];
  is_visible: boolean;
  is_tracking_enabled: boolean;
  send_setup?: boolean;
}
