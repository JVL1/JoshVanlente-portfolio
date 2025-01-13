import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const yahooToken = cookieStore.get('yahoo_token');
        const yahooRefreshToken = cookieStore.get('yahoo_refresh_token');

        // Check if we have both tokens
        const authenticated = !!(yahooToken && yahooRefreshToken);

        return NextResponse.json({ 
            authenticated,
            // Only include token info if authenticated
            ...(authenticated && {
                token: yahooToken.value,
                refreshToken: yahooRefreshToken.value
            })
        });

    } catch (error: any) {
        console.error('Auth Check Error:', error);
        return NextResponse.json(
            { 
                authenticated: false,
                error: error.message || 'Failed to check authentication status'
            },
            { status: 500 }
        );
    }
} 