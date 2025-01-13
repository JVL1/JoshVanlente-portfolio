import { NextRequest, NextResponse } from 'next/server';
import { getStoredTokens, isTokenExpired } from '@/lib/fantasy/auth';
import type { SearchResult, ApiError, Player } from '@/lib/fantasy/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const tokens = getStoredTokens();
        if (!tokens || isTokenExpired(tokens)) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Get search parameters
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        
        if (!query) {
            return NextResponse.json(
                { error: 'Search query is required' },
                { status: 400 }
            );
        }

        // First, get the current NFL game
        const gamesUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/games;game_codes=nfl;is_available=1?format=json';
        console.log('Fetching games from Yahoo API:', gamesUrl);

        const gamesResponse = await fetch(gamesUrl, {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Accept': 'application/json',
            },
        });

        if (!gamesResponse.ok) {
            const errorText = await gamesResponse.text();
            console.error('Yahoo API Games Error:', {
                status: gamesResponse.status,
                statusText: gamesResponse.statusText,
                error: errorText
            });
            throw new Error(`Yahoo API error: ${gamesResponse.statusText}`);
        }

        const gamesData = await gamesResponse.json();
        console.log('Games response:', JSON.stringify(gamesData, null, 2));

        // Get the current game from the response
        const currentGame = gamesData.fantasy_content?.games?.[0]?.game?.[0];
        if (!currentGame?.game_key) {
            console.error('No current NFL game found:', gamesData);
            throw new Error('Failed to get current NFL game');
        }

        const gameKey = currentGame.game_key;
        console.log(`Using NFL game key:`, gameKey, 'Season:', currentGame.season);

        // Search for players using the game key - only get basic info, no stats
        const url = `https://fantasysports.yahooapis.com/fantasy/v2/game/${gameKey}/players;search=${encodeURIComponent(query)}?format=json`;
        console.log('Fetching players from Yahoo API:', url);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Yahoo API Players Error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(`Yahoo API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Raw player search response:', JSON.stringify(data, null, 2));
        
        // Get the players data from the nested structure
        const playersData = data.fantasy_content?.game?.[1]?.players;
        if (!playersData) {
            console.log('No players found in response:', data);
            return NextResponse.json({ players: [], total: 0 });
        }

        // Transform the players data
        const transformedPlayers = Object.entries(playersData)
            .filter(([key]) => key !== 'count')
            .map(([_, playerData]: [string, any]): Player | null => {
                try {
                    // Get the player's array of fields
                    const playerFields = playerData.player[0];
                    
                    // Convert array of fields to an object
                    const playerInfo = playerFields.reduce((acc: any, field: any) => {
                        const key = Object.keys(field)[0];
                        acc[key] = field[key];
                        return acc;
                    }, {});

                    // Check for required fields
                    if (!playerInfo.player_key || !playerInfo.player_id || !playerInfo.name) {
                        console.log('Missing required player info:', playerInfo);
                        return null;
                    }

                    // Return player information
                    return {
                        player_id: playerInfo.player_id,
                        player_key: playerInfo.player_key,
                        name: {
                            full: playerInfo.name.full || '',
                            first: playerInfo.name.first || '',
                            last: playerInfo.name.last || '',
                            ascii_first: playerInfo.name.ascii_first,
                            ascii_last: playerInfo.name.ascii_last,
                        },
                        editorial_team_abbr: playerInfo.editorial_team_abbr || '',
                        editorial_team_full_name: playerInfo.editorial_team_full_name || '',
                        team: playerInfo.editorial_team_abbr || '',
                        position: playerInfo.display_position || '',
                        display_position: playerInfo.display_position || '',
                        status: playerInfo.status || null,
                        injury_status: playerInfo.injury_status || null,
                        percent_owned: undefined, // Not available in basic search
                        rank_overall: undefined, // Not available in basic search
                        rank_position: undefined, // Not available in basic search
                        uniform_number: playerInfo.uniform_number || null,
                        eligible_positions: playerInfo.eligible_positions?.map((p: any) => p.position) || [],
                        bye_week: playerInfo.bye_weeks?.week || null,
                        headshot: playerInfo.headshot ? {
                            url: playerInfo.headshot.url,
                            size: playerInfo.headshot.size,
                        } : undefined,
                    };
                } catch (error) {
                    console.error('Error transforming player data:', error, playerData);
                    return null;
                }
            })
            .filter((player): player is Player => player !== null);

        console.log('Transformed players:', JSON.stringify(transformedPlayers, null, 2));

        const result: SearchResult = {
            players: transformedPlayers,
            total: transformedPlayers.length,
        };

        return NextResponse.json(result);

    } catch (error) {
        console.error('Player Search Error:', error);
        const apiError: ApiError = {
            code: 'SEARCH_ERROR',
            message: error instanceof Error ? error.message : 'Failed to search players',
        };
        return NextResponse.json(apiError, { status: 500 });
    }
} 