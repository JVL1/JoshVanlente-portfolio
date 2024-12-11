import { NextRequest, NextResponse } from 'next/server';
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
        const code = searchParams.get('code');

        if (!code) {
            // If no code, redirect to Yahoo OAuth
            const authUrl = `https://api.login.yahoo.com/oauth2/request_auth?client_id=${YAHOO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=fspt-w`;
            return NextResponse.redirect(authUrl);
        }

        // Exchange code for tokens
        await yahooClient.authenticate(code);

        // Redirect to the fantasy dashboard
        return NextResponse.redirect('/fantasy');

    } catch (error: any) {
        console.error('Yahoo Auth Error:', error);
        return NextResponse.json(
            { error: error.message || 'Authentication failed' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { refresh_token } = await request.json();

        if (!refresh_token) {
            return NextResponse.json(
                { error: 'Refresh token is required' },
                { status: 400 }
            );
        }

        await yahooClient.refreshToken(refresh_token);
        
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Token Refresh Error:', error);
        return NextResponse.json(
            { error: error.message || 'Token refresh failed' },
            { status: 500 }
        );
    }
} 