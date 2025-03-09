export type Json = string | number | boolean | null | {
    [key: string]: Json | undefined;
} | Json[];
export type Database = {
    public: {
        Tables: {
            categories: {
                Row: {
                    allowed_roles: string[];
                    category_type: string;
                    created_at: string;
                    discord_category_id: string | null;
                    guild_id: string;
                    id: string;
                    last_usage_at: string | null;
                    name: string;
                    settings: Json;
                    total_seconds_in_category: number;
                    updated_at: string;
                };
                Insert: {
                    allowed_roles?: string[];
                    category_type?: string;
                    created_at?: string;
                    discord_category_id?: string | null;
                    guild_id: string;
                    id?: string;
                    last_usage_at?: string | null;
                    name: string;
                    settings?: Json;
                    total_seconds_in_category?: number;
                    updated_at?: string;
                };
                Update: {
                    allowed_roles?: string[];
                    category_type?: string;
                    created_at?: string;
                    discord_category_id?: string | null;
                    guild_id?: string;
                    id?: string;
                    last_usage_at?: string | null;
                    name?: string;
                    settings?: Json;
                    total_seconds_in_category?: number;
                    updated_at?: string;
                };
                Relationships: [];
            };
            discord_sync: {
                Row: {
                    data: Json;
                    entity_type: string;
                    guild_id: string;
                    id: string;
                    last_synced_at: string;
                    sync_status: string;
                };
                Insert: {
                    data: Json;
                    entity_type: string;
                    guild_id: string;
                    id: string;
                    last_synced_at?: string;
                    sync_status?: string;
                };
                Update: {
                    data?: Json;
                    entity_type?: string;
                    guild_id?: string;
                    id?: string;
                    last_synced_at?: string;
                    sync_status?: string;
                };
                Relationships: [];
            };
            events: {
                Row: {
                    created_at: string;
                    entity_id: string;
                    entity_type: string;
                    event_type: string;
                    id: string;
                    payload: Json;
                    processed: boolean;
                };
                Insert: {
                    created_at?: string;
                    entity_id: string;
                    entity_type: string;
                    event_type: string;
                    id?: string;
                    payload: Json;
                    processed?: boolean;
                };
                Update: {
                    created_at?: string;
                    entity_id?: string;
                    entity_type?: string;
                    event_type?: string;
                    id?: string;
                    payload?: Json;
                    processed?: boolean;
                };
                Relationships: [];
            };
            task_queue: {
                Row: {
                    attempts: number;
                    completed_at: string | null;
                    created_at: string;
                    error: string | null;
                    id: string;
                    max_attempts: number;
                    payload: Json;
                    priority: number;
                    result: Json | null;
                    scheduled_for: string;
                    status: string;
                    task_type: string;
                    updated_at: string;
                };
                Insert: {
                    attempts?: number;
                    completed_at?: string | null;
                    created_at?: string;
                    error?: string | null;
                    id?: string;
                    max_attempts?: number;
                    payload: Json;
                    priority?: number;
                    result?: Json | null;
                    scheduled_for?: string;
                    status?: string;
                    task_type: string;
                    updated_at?: string;
                };
                Update: {
                    attempts?: number;
                    completed_at?: string | null;
                    created_at?: string;
                    error?: string | null;
                    id?: string;
                    max_attempts?: number;
                    payload?: Json;
                    priority?: number;
                    result?: Json | null;
                    scheduled_for?: string;
                    status?: string;
                    task_type?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            zones: {
                Row: {
                    category_id: string;
                    created_at: string;
                    discord_voice_id: string | null;
                    id: string;
                    last_usage_at: string | null;
                    name: string;
                    settings: Json;
                    stats: Json;
                    updated_at: string;
                    zone_key: string;
                };
                Insert: {
                    category_id: string;
                    created_at?: string;
                    discord_voice_id?: string | null;
                    id?: string;
                    last_usage_at?: string | null;
                    name: string;
                    settings?: Json;
                    stats?: Json;
                    updated_at?: string;
                    zone_key: string;
                };
                Update: {
                    category_id?: string;
                    created_at?: string;
                    discord_voice_id?: string | null;
                    id?: string;
                    last_usage_at?: string | null;
                    name?: string;
                    settings?: Json;
                    stats?: Json;
                    updated_at?: string;
                    zone_key?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "zones_category_id_fkey";
                        columns: ["category_id"];
                        isOneToOne: false;
                        referencedRelation: "categories";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Views: {
            discord_channels: {
                Row: {
                    guild_id: string | null;
                    id: string | null;
                    name: string | null;
                    parent_id: string | null;
                    type: string | null;
                };
                Insert: {
                    guild_id?: string | null;
                    id?: string | null;
                    name?: never;
                    parent_id?: never;
                    type?: never;
                };
                Update: {
                    guild_id?: string | null;
                    id?: string | null;
                    name?: never;
                    parent_id?: never;
                    type?: never;
                };
                Relationships: [];
            };
            discord_roles: {
                Row: {
                    color: number | null;
                    guild_id: string | null;
                    id: string | null;
                    is_hoist: boolean | null;
                    name: string | null;
                };
                Insert: {
                    color?: never;
                    guild_id?: string | null;
                    id?: string | null;
                    is_hoist?: never;
                    name?: never;
                };
                Update: {
                    color?: never;
                    guild_id?: string | null;
                    id?: string | null;
                    is_hoist?: never;
                    name?: never;
                };
                Relationships: [];
            };
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};
type PublicSchema = Database[Extract<keyof Database, "public">];
export type Tables<PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"]) | {
    schema: keyof Database;
}, TableName extends PublicTableNameOrOptions extends {
    schema: keyof Database;
} ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] & Database[PublicTableNameOrOptions["schema"]]["Views"]) : never = never> = PublicTableNameOrOptions extends {
    schema: keyof Database;
} ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] & Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
    Row: infer R;
} ? R : never : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"]) ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions] extends {
    Row: infer R;
} ? R : never : never;
export type TablesInsert<PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | {
    schema: keyof Database;
}, TableName extends PublicTableNameOrOptions extends {
    schema: keyof Database;
} ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"] : never = never> = PublicTableNameOrOptions extends {
    schema: keyof Database;
} ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I;
} ? I : never : PublicTableNameOrOptions extends keyof PublicSchema["Tables"] ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I;
} ? I : never : never;
export type TablesUpdate<PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | {
    schema: keyof Database;
}, TableName extends PublicTableNameOrOptions extends {
    schema: keyof Database;
} ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"] : never = never> = PublicTableNameOrOptions extends {
    schema: keyof Database;
} ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U;
} ? U : never : PublicTableNameOrOptions extends keyof PublicSchema["Tables"] ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U;
} ? U : never : never;
export type Enums<PublicEnumNameOrOptions extends keyof PublicSchema["Enums"] | {
    schema: keyof Database;
}, EnumName extends PublicEnumNameOrOptions extends {
    schema: keyof Database;
} ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"] : never = never> = PublicEnumNameOrOptions extends {
    schema: keyof Database;
} ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName] : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"] ? PublicSchema["Enums"][PublicEnumNameOrOptions] : never;
export type CompositeTypes<PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"] | {
    schema: keyof Database;
}, CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
} ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] : never = never> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
} ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName] : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"] ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions] : never;
export {};
