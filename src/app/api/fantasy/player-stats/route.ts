import { NextRequest, NextResponse } from 'next/server';
import { getStoredTokens, isTokenExpired } from '@/lib/fantasy/auth';
import { NFL_STAT_MAPPINGS } from '@/lib/fantasy/statMappings';
import { storePlayerStats } from '@/lib/fantasy/pinecone';
import { initializeApp } from '@/lib/init';
import type { ApiError, Player, PlayerStats, StatValue, WeeklyStats } from '@/lib/fantasy/types';

function transformStats(statsData: any[], includePoints: boolean = false): {
    raw: Record<string, number>;
    formatted: Record<string, StatValue>;
    byCategory: Record<string, Record<string, StatValue>>;
    fantasyPoints?: number;
} {
    // Create the raw stats object
    const rawStats = statsData.reduce((acc: Record<string, number>, stat: any) => {
        if (stat.stat?.stat_id && stat.stat?.value !== undefined) {
            const value = parseFloat(stat.stat.value);
            if (!isNaN(value)) {
                acc[stat.stat.stat_id] = value;
            }
        }
        return acc;
    }, {});

    // Create formatted stats with labels and categories
    const formattedStats: Record<string, StatValue> = {};
    const statsByCategory: Record<string, Record<string, StatValue>> = {};
    let fantasyPoints: number | undefined;

    // Process each stat and organize by category
    Object.entries(rawStats).forEach(([statId, value]) => {
        const mapping = NFL_STAT_MAPPINGS[statId];
        if (mapping) {
            const statValue: StatValue = {
                value,
                display: mapping.display,
                name: mapping.name,
                category: mapping.category
            };

            // Add to formatted stats
            formattedStats[statId] = statValue;

            // Add to category grouping
            if (!statsByCategory[mapping.category]) {
                statsByCategory[mapping.category] = {};
            }
            statsByCategory[mapping.category][statId] = statValue;
        }
    });

    // Extract fantasy points if available
    if (includePoints) {
        // Log the raw stats data for debugging
        console.log('Raw Stats Data:', JSON.stringify(statsData, null, 2));
        
        // Try to find points in different possible locations
        const points = statsData.find((stat: any) => 
            stat.stat?.points !== undefined || 
            stat.points !== undefined ||
            (stat.stat?.value !== undefined && stat.stat?.stat_id === 'points')
        );

        if (points) {
            const pointsValue = points.stat?.points ?? points.points ?? points.stat?.value;
            fantasyPoints = parseFloat(pointsValue);
            console.log('Found Fantasy Points:', fantasyPoints);
        }
    }

    return {
        raw: rawStats,
        formatted: formattedStats,
        byCategory: statsByCategory,
        fantasyPoints: !isNaN(fantasyPoints!) ? fantasyPoints : undefined
    };
}

async function fetchWeeklyStats(playerKey: string, leagueKey: string, tokens: TokenStore): Promise<WeeklyStats[]> {
    const weeklyStats: WeeklyStats[] = [];
    
    // Fetch each week individually since the batch request isn't working as expected
    for (let week = 1; week <= 17; week++) {
        // Use the correct endpoint format to get fantasy points
        const weekUrl = `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/players;player_keys=${playerKey}/stats;type=week;week=${week}/points?format=json`;
        
        try {
            const response = await fetch(weekUrl, {
                headers: {
                    'Authorization': `Bearer ${tokens.access_token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) continue;

            const data = await response.json();
            const playerData = data.fantasy_content?.league?.[1]?.players?.[0]?.player;
            if (!playerData) continue;

            // Extract points and stats
            const playerStats = playerData[1]?.player_points?.total || 0;
            const statsData = playerData[1]?.player_stats?.stats || [];
            
            const stats = transformStats(statsData);
            const points = parseFloat(playerStats);

            if (Object.keys(stats.raw).length > 0 || !isNaN(points)) {
                weeklyStats.push({
                    week,
                    stats,
                    fantasyPoints: !isNaN(points) ? points : undefined
                });
            }
        } catch (error) {
            console.error(`Error fetching week ${week}:`, error);
        }
    }

    return weeklyStats.sort((a, b) => a.week - b.week);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Initialize app if needed
        await initializeApp();
        
        const tokens = getStoredTokens();
        if (!tokens || isTokenExpired(tokens)) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Get player key and league key from query parameters
        const { searchParams } = new URL(request.url);
        const playerKey = searchParams.get('player_key');
        const leagueKey = searchParams.get('league_key');
        
        if (!playerKey) {
            return NextResponse.json(
                { error: 'Player key is required' },
                { status: 400 }
            );
        }

        // Base URL for stats - use league context if provided
        const baseUrl = leagueKey 
            ? `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/players;player_keys=${playerKey}/stats/points` 
            : `https://fantasysports.yahooapis.com/fantasy/v2/player/${playerKey}/stats`;

        // Fetch season stats
        const seasonUrl = `${baseUrl}?format=json`;
        console.log('Fetching season stats from Yahoo API:', seasonUrl);

        const seasonResponse = await fetch(seasonUrl, {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Accept': 'application/json',
            },
        });

        if (!seasonResponse.ok) {
            const errorText = await seasonResponse.text();
            console.error('Yahoo API Error:', {
                status: seasonResponse.status,
                statusText: seasonResponse.statusText,
                error: errorText
            });
            throw new Error(`Yahoo API error: ${seasonResponse.statusText}`);
        }

        const seasonData = await seasonResponse.json();
        
        // Extract player data and stats based on context
        const playerData = leagueKey 
            ? seasonData.fantasy_content?.league?.[1]?.players?.[0]?.player
            : seasonData.fantasy_content?.player;

        if (!playerData) {
            console.log('No player data found in response:', seasonData);
            return NextResponse.json(
                { error: 'Player not found' },
                { status: 404 }
            );
        }

        // Convert array of player fields to an object
        const playerInfo = Array.isArray(playerData[0]) ? playerData[0].reduce((acc: any, field: any) => {
            const key = Object.keys(field)[0];
            acc[key] = field[key];
            return acc;
        }, {}) : playerData[0];

        // Extract season stats and points
        const seasonStatsData = playerData[1]?.player_stats?.stats || [];
        const seasonPoints = leagueKey ? parseFloat(playerData[1]?.player_points?.total || '0') : undefined;

        const seasonStats = transformStats(seasonStatsData);
        if (leagueKey && !isNaN(seasonPoints)) {
            seasonStats.fantasyPoints = seasonPoints;
        }

        // Fetch weekly stats if we have a league context
        const weeklyStats = leagueKey ? await fetchWeeklyStats(playerKey, leagueKey, tokens) : [];

        // Store stats in Pinecone
        const currentSeason = new Date().getFullYear().toString();
        
        // Store season stats
        if (seasonStats.raw && Object.keys(seasonStats.raw).length > 0) {
            await storePlayerStats(
                playerInfo.player_key,
                playerInfo.name.full,
                playerInfo.editorial_team_abbr,
                playerInfo.display_position,
                seasonStats.raw,
                seasonStats.fantasyPoints || 0,
                currentSeason,
                undefined,
                leagueKey,
                playerInfo.status || 'Active',
                playerInfo.name.first,
                playerInfo.name.last
            );
        }

        // Store weekly stats
        for (const weekStat of weeklyStats) {
            if (weekStat.stats.raw && Object.keys(weekStat.stats.raw).length > 0) {
                await storePlayerStats(
                    playerInfo.player_key,
                    playerInfo.name.full,
                    playerInfo.editorial_team_abbr,
                    playerInfo.display_position,
                    weekStat.stats.raw,
                    weekStat.fantasyPoints || 0,
                    currentSeason,
                    weekStat.week,
                    leagueKey,
                    playerInfo.status || 'Active',
                    playerInfo.name.first,
                    playerInfo.name.last
                );
            }
        }

        // Create the enhanced stats object
        const stats: PlayerStats = {
            season: seasonStats,
            weekly: weeklyStats
        };

        // Combine player info with stats
        const player: Player = {
            player_id: playerInfo.player_id || '',
            player_key: playerInfo.player_key || '',
            name: {
                full: playerInfo.name?.full || '',
                first: playerInfo.name?.first || '',
                last: playerInfo.name?.last || '',
                ascii_first: playerInfo.name?.ascii_first,
                ascii_last: playerInfo.name?.ascii_last,
            },
            editorial_team_abbr: playerInfo.editorial_team_abbr || '',
            editorial_team_full_name: playerInfo.editorial_team_full_name,
            team: playerInfo.editorial_team_abbr || '',
            position: playerInfo.display_position || '',
            display_position: playerInfo.display_position || '',
            status: playerInfo.status,
            injury_status: playerInfo.injury_status,
            percent_owned: playerInfo.percent_owned ? parseFloat(playerInfo.percent_owned.value) : undefined,
            rank_overall: playerInfo.rank ? parseInt(playerInfo.rank.overall, 10) : undefined,
            rank_position: playerInfo.rank ? parseInt(playerInfo.rank.position, 10) : undefined,
            uniform_number: playerInfo.uniform_number,
            eligible_positions: playerInfo.eligible_positions?.map((p: any) => p.position),
            bye_week: playerInfo.bye_weeks?.week ? parseInt(playerInfo.bye_weeks.week, 10) : null,
            stats,
            headshot: playerInfo.headshot ? {
                url: playerInfo.headshot.url,
                size: playerInfo.headshot.size,
            } : undefined,
        };

        return NextResponse.json(player);

    } catch (error) {
        console.error('Player Stats Error:', error);
        const apiError: ApiError = {
            code: 'STATS_ERROR',
            message: error instanceof Error ? error.message : 'Failed to fetch player stats',
        };
        return NextResponse.json(apiError, { status: 500 });
    }
} 