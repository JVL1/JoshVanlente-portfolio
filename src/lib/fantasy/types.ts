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

export interface Player {
    player_id: string;
    name: {
        full: string;
        first: string;
        last: string;
    };
    team: string;
    position: string;
    status: string;
    stats?: PlayerStats;
    notes?: PlayerNote[];
}

export interface PlayerStats {
    season: string;
    stats: {
        [key: string]: number;  // Different stat categories
    };
    projected?: {
        [key: string]: number;
    };
}

export interface PlayerNote {
    timestamp: string;
    source: string;
    note: string;
}

export interface SearchResult {
    players: Player[];
    total: number;
}

export interface ApiError {
    code: string;
    message: string;
} 