export interface YahooConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export interface YahooAuthResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}

export interface StatValue {
    value: number;
    display: string;
    name: string;
    category: string;
}

export interface StatTransform {
    raw: Record<string, number>;
    formatted: Record<string, StatValue>;
    byCategory: Record<string, Record<string, StatValue>>;
    fantasyPoints?: number;
}

export interface WeeklyStats {
    week: number;
    stats: StatTransform;
    fantasyPoints?: number;
}

export interface PlayerStats {
    season: StatTransform;
    weekly: WeeklyStats[];
}

export interface PlayerName {
    full: string;
    first: string;
    last: string;
    ascii_first?: string;
    ascii_last?: string;
}

export interface Player {
    player_id: string;
    player_key: string;
    name: {
        full: string;
        first: string;
        last: string;
        ascii_first?: string;
        ascii_last?: string;
    };
    editorial_team_abbr: string;
    editorial_team_full_name?: string;
    team: string;
    position: string;
    display_position: string;
    status?: string | null;
    injury_status?: string | null;
    percent_owned?: number;
    rank_overall?: number;
    rank_position?: number;
    uniform_number?: string | null;
    eligible_positions?: string[];
    bye_week?: number | null;
    stats?: PlayerStats;
    headshot?: {
        url: string;
        size: string;
    };
}

export interface SearchResult {
    players: Player[];
    total: number;
}

export interface ApiError {
    code: string;
    message: string;
}

export interface TokenStore {
    access_token: string;
    refresh_token: string;
    expires_at: number;
}

export interface StatPrediction {
    passing_yards: number;
    passing_touchdowns: number;
    passing_interceptions: number;
    rushing_yards: number;
    rushing_touchdowns: number;
    receiving_yards: number;
    receiving_touchdowns: number;
    receptions: number;
    targets: number;
    fantasy_points: number;
}

export interface PlayerPrediction {
    prediction: StatPrediction;
    confidence: number;
    analysis: string;
} 