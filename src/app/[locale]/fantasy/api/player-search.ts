import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import YahooFantasyClient from '@/lib/fantasy/yahoo';

const YAHOO_CLIENT_ID = process.env.YAHOO_CLIENT_ID!;
const YAHOO_CLIENT_SECRET = process.env.YAHOO_CLIENT_SECRET!;
const REDIRECT_URI = process.env.YAHOO_REDIRECT_URI!;

const yahooClient = new YahooFantasyClient({
    clientId: YAHOO_CLIENT_ID,
    clientSecret: YAHOO_CLIENT_SECRET,
    redirectUri: REDIRECT_URI
});

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json(
                { error: 'Search query is required' },
                { status: 400 }
            );
        }

        // Get tokens from cookies
        const cookieStore = cookies();
        const yahooToken = cookieStore.get('yahoo_token');
        const yahooRefreshToken = cookieStore.get('yahoo_refresh_token');

        if (!yahooToken || !yahooRefreshToken) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Try to use current token
        try {
            const result = await yahooClient.searchPlayers(query);
            return NextResponse.json(result);
        } catch (error: any) {
            // If token expired, try to refresh
            if (error.code === 'TOKEN_EXPIRED') {
                await yahooClient.refreshToken(yahooRefreshToken.value);
                const result = await yahooClient.searchPlayers(query);
                return NextResponse.json(result);
            }
            throw error;
        }

    } catch (error: any) {
        console.error('Player Search Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to search players' },
            { status: 500 }
        );
    }
} 