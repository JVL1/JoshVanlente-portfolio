declare module 'yahoo-fantasy' {
    export default class YahooFantasy {
        constructor(clientId: string, clientSecret: string);
        token: string;
        auth(code: string): Promise<void>;
        refreshToken(refreshToken: string): Promise<void>;
        games: {
            user(options: { seasons: string }): Promise<any[]>;
        };
        players: {
            search(query: string, options: { game_code: string; game_key: string }): Promise<any[]>;
        };
        player: {
            stats(playerId: string): Promise<any>;
        };
    }
} 