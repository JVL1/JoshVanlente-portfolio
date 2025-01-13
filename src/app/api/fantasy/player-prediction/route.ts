import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getStoredTokens, isTokenExpired } from '@/lib/fantasy/auth';
import { NFL_STAT_MAPPINGS } from '@/lib/fantasy/statMappings';
import type { ApiError, PlayerPrediction, WeeklyStats } from '@/lib/fantasy/types';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

function formatStatsForPrompt(weeklyStats: WeeklyStats[]): string {
    let prompt = 'Historical weekly performance:\n\n';
    
    weeklyStats.forEach(week => {
        prompt += `Week ${week.week}:\n`;
        if (week.stats.raw) {
            Object.entries(week.stats.raw).forEach(([statId, value]) => {
                const mapping = NFL_STAT_MAPPINGS[statId];
                if (mapping) {
                    prompt += `${mapping.name}: ${value} ${mapping.display}\n`;
                }
            });
        }
        if (week.fantasyPoints !== undefined) {
            prompt += `Fantasy Points: ${week.fantasyPoints}\n`;
        }
        prompt += '\n';
    });
    
    return prompt;
}

async function generatePrediction(
    playerName: string,
    position: string,
    team: string,
    weeklyStats: WeeklyStats[],
    targetWeek: number
): Promise<PlayerPrediction> {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a fantasy football analyst with deep expertise in NFL player statistics and performance prediction.

Player Information:
Name: ${playerName}
Position: ${position}
Team: ${team}
Target Week: ${targetWeek}

${formatStatsForPrompt(weeklyStats)}

Based on the historical weekly performance data above, predict this player's performance for Week ${targetWeek}. 
Consider factors like:
- Recent performance trends
- Consistency patterns
- Position-specific metrics
- Team matchups and game script

Provide a detailed statistical prediction in this exact JSON format:
{
    "prediction": {
        "passing_yards": number,
        "passing_touchdowns": number,
        "passing_interceptions": number,
        "rushing_yards": number,
        "rushing_touchdowns": number,
        "receiving_yards": number,
        "receiving_touchdowns": number,
        "receptions": number,
        "targets": number,
        "fantasy_points": number
    },
    "confidence": number (0-1),
    "analysis": "string explaining the prediction"
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in response');
        }
        
        const prediction = JSON.parse(jsonMatch[0]);
        return prediction;
    } catch (error) {
        console.error('Error generating prediction:', error);
        throw error;
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const tokens = getStoredTokens();
        if (!tokens || isTokenExpired(tokens)) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { 
            player_name,
            position,
            team,
            weekly_stats,
            target_week 
        } = body;

        if (!player_name || !position || !team || !weekly_stats || !target_week) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const prediction = await generatePrediction(
            player_name,
            position,
            team,
            weekly_stats,
            target_week
        );

        return NextResponse.json(prediction);

    } catch (error) {
        console.error('Player Prediction Error:', error);
        const apiError: ApiError = {
            code: 'PREDICTION_ERROR',
            message: error instanceof Error ? error.message : 'Failed to generate prediction',
        };
        return NextResponse.json(apiError, { status: 500 });
    }
} 