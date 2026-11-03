export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  city?: string | null;
  created_at?: string;
  updated_at?: string;
  is_guest?: boolean; // Identifica si el usuario es un invitado shadow
  is_premium?: boolean;
}

export interface Game {
  id?: string;
  bgg_id: number;
  title: string;              // Original English/international title — never overwritten
  title_es?: string | null;   // Spanish title (null = no Spanish edition or not yet checked)
  publisher?: string | null;  // Original publisher (e.g. "Fantasy Flight Games")
  es_publisher?: string | null; // Spanish publisher (e.g. "Edge Entertainment")
  has_spanish_edition?: boolean;
  year_published?: number | null;
  es_year_published?: number | null; // Year the Spanish edition was published
  es_release_date?: string | null;   // Exact or estimated release date in Spain (YYYY-MM-DD)
  image_url: string | null;
  image_url_es?: string | null;     // Spanish cover image from BGG CDN
  spanish_checked_at?: string | null; // Timestamp of when BGG was inspected for Spanish edition
  min_players?: number | null;
  max_players?: number | null;
  playing_time?: number | null;
  winner_user_id?: string | null;   // Joined from meetup_games context
  winner_guest_id?: string | null;  // Joined from meetup_games context
  winner_score?: string | null;
  is_expansion?: boolean;
  base_game_id?: string | null;
  bgg_base_game_id?: number | null;
  isFromBgg?: boolean;              // Frontend-only flag, not in DB
  bgg_rank?: number | null;
  rating_geek?: number | null;
  rating_average?: number | null;
  complexity?: number | null;
  min_play_time?: number | null;
  max_play_time?: number | null;
  min_age?: number | null;
  categories?: string[] | null;
  mechanics?: string[] | null;
}

export type MeepleColor = 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'orange';

export interface PlayerScore {
  userId?: string | null;
  guestId?: string | null;
  name: string;
  score: number;
  meepleColor: MeepleColor;
  rank?: number;
  isWinner?: boolean;
}

export interface Meetup {
  id: string;
  creator_id: string;
  group_id?: string | null;       // Linked group for Table Companion mode
  game_id?: number | null;
  title: string;
  description: string | null;
  city: string | null;
  location: string | null;
  date: string;
  max_players: number;
  joined_players: string[];
  created_at?: string;
  updated_at?: string;
  users?: UserProfile;
  games?: Game[];
  game_name?: string; // Usado en datos mock y compatibilidad
  meetup_guests?: { id: string; guest_name: string }[];
  completed?: boolean;
  attended_players?: string[];
  attended_guests?: string[];
  is_online?: boolean;
  platform?: string | null;
  voice_link?: string | null;
  board_photo_url?: string | null; // Final photo of table
  player_scores?: PlayerScore[] | null; // Detailed player scores
  first_player_id?: string | null; // First player determined in session
}

/** Alias for Meetup representing a Table Companion session */
export type TableSession = Meetup;

export interface UserCollectionItem {
  id?: string;
  user_id: string;
  game_id: number;
  created_at?: string;
  is_unplayed?: boolean;
  play_count?: number;
  games?: Game;
}

export interface BggSearchResult {
  bgg_id: string;
  name: string;
  year?: number;
  image_url?: string | null;
  min_players?: number;
  max_players?: number;
  playing_time?: number;
}

export interface MeetupMessage {
  id: string;
  meetup_id: string;
  user_id: string | null;
  guest_id: string | null;
  sender_name: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
}

export interface HallOfFameMember {
  userId: string;
  username: string;
  avatarUrl: string | null;
  wins: number;
  totalPlayed: number;
  winRate: number;
  currentStreak: number;
  maxStreak: number;
  isGuest?: boolean;
}

export interface RivalryStat {
  opponentId: string;
  opponentName: string;
  opponentAvatar: string | null;
  count: number;
  totalMatchesTogether: number;
}

export interface GameRecord {
  gameId: number;
  gameTitle: string;
  gameImage: string | null;
  highScore: number;
  holderName: string;
  holderAvatar: string | null;
  holderId: string | null;
  date: string;
}

export interface WinStreakRecord {
  userId: string;
  username: string;
  avatarUrl: string | null;
  streakCount: number;
  isActive: boolean;
}

