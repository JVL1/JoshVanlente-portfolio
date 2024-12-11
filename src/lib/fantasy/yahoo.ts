import YahooFantasy from 'yahoo-fantasy';
import { YahooConfig, Player, SearchResult, ApiError } from './types';

class YahooFantasyClient {
    private yf: any;
    private config: YahooConfig;
    private accessToken: string | null = null;

    constructor(config: YahooConfig) {
        this.config = config;
        this.yf = new YahooFantasy(
            this.config.clientId,
            this.config.clientSecret
        );
    }

    async authenticate(code: string): Promise<void> {
        try {
            await this.yf.auth(code);
            this.accessToken = this.yf.token;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async refreshToken(refreshToken: string): Promise<void> {
        try {
            await this.yf.refreshToken(refreshToken);
            this.accessToken = this.yf.token;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async searchPlayers(query: string): Promise<SearchResult> {
        try {
            if (!this.accessToken) {
                throw new Error('Not authenticated');
            }

            // Get the current NFL game
            const games = await this.yf.games.user({ seasons: '2024' });
            const nflGame = games.find((game: any) => game.code === 'nfl');
            
            if (!nflGame) {
                throw new Error('NFL game not found');
            }

            // Search for players
            const result = await this.yf.players.search(query, {
                game_code: 'nfl',
                game_key: nflGame.game_key
            });

            // Transform the response to match our Player interface
            const players = result.map((player: any) => ({
                player_id: player.player_id,
                name: {
                    full: player.name.full,
                    first: player.name.first,
                    last: player.name.last
                },
                team: player.editorial_team_abbr,
                position: player.display_position,
                status: player.status || 'Active',
                stats: player.stats ? {
                    season: '2024',
                    stats: player.stats
                } : undefined
            }));

            return {
                players,
                total: players.length
            };

        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getPlayerStats(playerId: string): Promise<Player> {
        try {
            if (!this.accessToken) {
                throw new Error('Not authenticated');
            }

            const player = await this.yf.player.stats(playerId);
            
            return {
                player_id: player.player_id,
                name: {
                    full: player.name.full,
                    first: player.name.first,
                    last: player.name.last
                },
                team: player.editorial_team_abbr,
                position: player.display_position,
                status: player.status || 'Active',
                stats: {
                    season: '2024',
                    stats: player.stats
                }
            };

        } catch (error) {
            throw this.handleError(error);
        }
    }

    private handleError(error: any): ApiError {
        console.error('Yahoo Fantasy API Error:', error);
        
        return {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || 'An unknown error occurred'
        };
    }
}

export default YahooFantasyClient; 