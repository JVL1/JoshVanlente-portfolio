import { NextRequest, NextResponse } from 'next/server';
import { getStoredTokens, isTokenExpired } from '@/lib/fantasy/auth';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const tokens = getStoredTokens();

        // Check if we have tokens and they're not expired
        const authenticated = !!(tokens && !isTokenExpired(tokens));

        return NextResponse.json({ 
            authenticated,
            // Only include token info if authenticated
            ...(authenticated && {
                expires_at: tokens.expires_at
            })
        });

    } catch (error) {
        console.error('Auth Check Error:', error);
        return NextResponse.json(
            { 
                authenticated: false,
                error: error instanceof Error ? error.message : 'Failed to check authentication status'
            },
            { status: 500 }
        );
    }
} 