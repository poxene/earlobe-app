export type PortraitAlbum = {
  id: string;
  name: string;
  artistName: string;
  imageUrl: string | null;
};

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<T> = {
  Row: T;
  Insert: { [K in keyof T]?: T[K] };
  Update: { [K in keyof T]?: T[K] };
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          lastfm_username: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          lastfm_username: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      lastfm_sessions: Table<{
        user_id: string;
        session_key: string;
        username: string;
      }>;
      characters: {
        Row: {
          user_id: string;
          active_class: string;
          subclass: string | null;
          unlocked_classes: string[];
          level: number;
          xp: number;
          stat_str: number;
          stat_agi: number;
          stat_int: number;
          stat_wis: number;
          stat_cha: number;
          unallocated_points: number;
          portrait: PortraitAlbum[];
          created_at: string;
          echoes: number;
          stat_bonus_str: number;
          stat_bonus_agi: number;
          stat_bonus_int: number;
          stat_bonus_wis: number;
          stat_bonus_cha: number;
          class_switched_at: string | null;
          last_seen_at: string | null;
          stats_refreshed_at: string | null;
          listening_xp_today: number;
          listening_xp_day: string | null;
          badges: string[];
          skills: string[];
          skill_picks: number;
          tree_nodes: string[];
          legacy_points: number;
          legacy_awarded: boolean;
          body: string;
        };
        Insert: {
          user_id: string;
          active_class: string;
          subclass?: string | null;
          unlocked_classes: string[];
          level?: number;
          xp?: number;
          stat_str: number;
          stat_agi: number;
          stat_int: number;
          stat_wis: number;
          stat_cha: number;
          unallocated_points?: number;
          portrait: PortraitAlbum[];
          created_at?: string;
          skill_picks?: number;
          legacy_points?: number;
          legacy_awarded?: boolean;
          tree_nodes?: string[];
          body?: string;
        };
        Update: {
          active_class?: string;
          subclass?: string | null;
          unlocked_classes?: string[];
          level?: number;
          xp?: number;
          stat_str?: number;
          stat_agi?: number;
          stat_int?: number;
          stat_wis?: number;
          stat_cha?: number;
          unallocated_points?: number;
          portrait?: PortraitAlbum[];
          echoes?: number;
          stat_bonus_str?: number;
          stat_bonus_agi?: number;
          stat_bonus_int?: number;
          stat_bonus_wis?: number;
          stat_bonus_cha?: number;
          class_switched_at?: string | null;
          last_seen_at?: string | null;
          stats_refreshed_at?: string | null;
          listening_xp_today?: number;
          listening_xp_day?: string | null;
          badges?: string[];
          skills?: string[];
          skill_picks?: number;
          tree_nodes?: string[];
          legacy_points?: number;
          legacy_awarded?: boolean;
          body?: string;
        };
        Relationships: [];
      };
      genre_weights: {
        Row: {
          user_id: string;
          genre_family: string;
          hours_30d: number;
          share: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          genre_family: string;
          hours_30d?: number;
          share: number;
          updated_at?: string;
        };
        Update: {
          hours_30d?: number;
          share?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      listening_events: Table<{
        id: string;
        user_id: string;
        track_id: string;
        track_name: string;
        artist_ids: string[];
        artist_names: string[];
        album_id: string;
        album_name: string;
        album_image_url: string | null;
        played_at: string;
        ms_played: number;
        duration_ms: number;
        genre_families: string[];
        xp_awarded: number;
        source_key: string;
        legacy: boolean;
      }>;
      artist_cache: Table<{
        artist_id: string;
        name: string;
        genres: string[];
        followers: number;
        image_url: string | null;
        fetched_at: string;
      }>;
      track_cache: Table<{
        track_id: string;
        duration_ms: number;
        fetched_at: string;
      }>;
      album_cache: Table<{
        album_id: string;
        track_ids: string[];
        fetched_at: string;
      }>;
      codex_artists: Table<{
        user_id: string;
        artist_id: string;
        name: string;
        image_url: string | null;
        genres: string[];
        discovered_at: string;
        listen_count: number;
      }>;
      codex_albums: Table<{
        user_id: string;
        album_id: string;
        name: string;
        artist_name: string;
        image_url: string | null;
        genre_family: string;
        tracks_total: number;
        tracks_played: number;
        completed_at: string | null;
        xp_awarded: boolean;
      }>;
      quests: Table<{
        id: string;
        user_id: string;
        type: string;
        title: string;
        description: string;
        objective: Json;
        xp_reward: number;
        expires_at: string;
        created_at: string;
      }>;
      quest_progress: Table<{
        user_id: string;
        quest_id: string;
        progress: Json;
        completed_at: string | null;
      }>;
      parties: Table<{
        id: string;
        name: string;
        invite_code: string;
        created_at: string;
      }>;
      party_members: Table<{
        party_id: string;
        user_id: string;
        joined_at: string;
      }>;
      feed_events: Table<{
        id: string;
        party_id: string | null;
        user_id: string;
        type: string;
        payload: Json;
        created_at: string;
      }>;
      material_stacks: Table<{
        id: string;
        user_id: string;
        slug: string;
        quantity: number;
        acquired_at: string;
      }>;
      relics: Table<{
        id: string;
        user_id: string;
        name: string;
        monster_type: string;
        genre_family: string;
        rarity: string;
        stat_bonuses: Json;
        effects: Json;
        equipped: boolean;
        equip_slot: number | null;
        gear_slug: string | null;
        acquired_at: string;
      }>;
      encounters: Table<{
        id: string;
        user_id: string;
        track_id: string;
        track_name: string;
        album_image_url: string | null;
        monster_type: string;
        genre_family: string;
        hp_max: number;
        dps_at_fight: number;
        echo_depth: number;
        outcome: string | null;
        grade: string | null;
        loot_echoes: number;
        relic_id: string | null;
        duration_ms: number;
        progress_ms: number;
        anchor_ms: number;
        source_key: string;
        started_at: string;
        resolved_at: string | null;
        skipped: boolean;
        bonus_damage: number;
        skill_id: string | null;
        echo_bonus: number;
        grade_bump: number;
        drop_advantage: boolean;
        xp_bonus: number;
        skill_cooldowns: Json;
      }>;
      bestiary: Table<{
        user_id: string;
        monster_type: string;
        encountered: number;
        defeated: number;
        escaped: number;
        best_grade: string | null;
        fastest_kill_sec: number | null;
      }>;
      presence: Table<{
        user_id: string;
        track_name: string | null;
        artist_name: string | null;
        image_url: string | null;
        updated_at: string;
      }>;
      rerolls: Table<{
        user_id: string;
        week_start: string;
      }>;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      user_id_for_lastfm_email: {
        Args: { target_email: string };
        Returns: string | null;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
