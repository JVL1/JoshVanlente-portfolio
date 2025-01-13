import { NextRequest, NextResponse } from 'next/server';
import { getStoredTokens, isTokenExpired } from '@/lib/fantasy/auth';

export interface League {
    league_key: string;
    league_id: string;
    name: string;
    season: string;
    game_code: string;
    is_active?: boolean;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const tokens = getStoredTokens();
        if (!tokens || isTokenExpired(tokens)) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Fetch user's leagues
        const url = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_codes=nfl/leagues?format=json';
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Yahoo API Error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(`Yahoo API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Extract leagues from the nested response
        const userLeagues: League[] = [];
        const games = data.fantasy_content?.users?.[0]?.user?.[1]?.games;

        if (games) {
            Object.values(games).forEach((game: any) => {
                if (game.game) {
                    const leagues = game.game[1]?.leagues;
                    if (leagues) {
                        Object.values(leagues).forEach((league: any) => {
                            if (league.league) {
                                userLeagues.push({
                                    league_key: league.league[0].league_key,
                                    league_id: league.league[0].league_id,
                                    name: league.league[0].name,
                                    season: league.league[0].season,
                                    game_code: game.game[0].code,
                                    is_active: league.league[0].is_active === '1'
                                });
                            }
                        });
                    }
                }
            });
        }

        return NextResponse.json({ leagues: userLeagues });

    } catch (error) {
        console.error('Leagues Error:', error);
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : 'Failed to fetch leagues'
            },
            { status: 500 }
        );
    }
} 