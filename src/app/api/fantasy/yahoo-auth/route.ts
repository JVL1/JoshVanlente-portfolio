import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { calculateExpiresAt } from '@/lib/fantasy/auth';
import type { YahooAuthResponse } from '@/lib/fantasy/types';

const YAHOO_CLIENT_ID = process.env.YAHOO_CLIENT_ID!;
const YAHOO_CLIENT_SECRET = process.env.YAHOO_CLIENT_SECRET!;
// Always use the HTTPS port (3003)
const REDIRECT_URI = process.env.YAHOO_REDIRECT_URI!.replace(':3000', ':3003');

// Yahoo OAuth endpoints
const YAHOO_AUTH_URL = 'https://api.login.yahoo.com/oauth2/request_auth';
const YAHOO_TOKEN_URL = 'https://api.login.yahoo.com/oauth2/get_token';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        // Log incoming request details for debugging
        console.log('Yahoo Auth Request:', {
            code: code ? 'present' : 'missing',
            error,
            errorDescription,
            redirectUri: REDIRECT_URI,
            fullUrl: request.url
        });

        // Handle Yahoo error response
        if (error) {
            console.error('Yahoo Auth Error:', { error, description: errorDescription });
            return NextResponse.redirect(
                new URL(`/fantasy?error=${encodeURIComponent(errorDescription || error)}`, request.url)
            );
        }
        
        // If no code, initiate OAuth flow
        if (!code) {
            const params = new URLSearchParams({
                client_id: YAHOO_CLIENT_ID,
                redirect_uri: REDIRECT_URI,
                response_type: 'code',
                scope: 'fspt-r'
            });

            const authUrl = `${YAHOO_AUTH_URL}?${params.toString()}`;
            console.log('Redirecting to Yahoo OAuth:', authUrl);
            
            return NextResponse.redirect(authUrl);
        }

        // Exchange code for tokens
        console.log('Exchanging code for tokens...');
        const tokenResponse = await fetch(YAHOO_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${YAHOO_CLIENT_ID}:${YAHOO_CLIENT_SECRET}`).toString('base64')}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI
            })
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            console.error('Token exchange failed:', errorData);
            throw new Error('Failed to exchange code for tokens');
        }

        const tokens: YahooAuthResponse = await tokenResponse.json();
        const expires_at = calculateExpiresAt(tokens.expires_in);

        // Store tokens in secure cookies
        const cookieStore = cookies();
        const secure = true; // Always use secure cookies since we're using HTTPS
        const maxAge = 30 * 24 * 60 * 60; // 30 days

        cookieStore.set('yahoo_token', tokens.access_token, {
            httpOnly: true,
            secure,
            sameSite: 'lax',
            maxAge,
            path: '/'
        });

        cookieStore.set('yahoo_refresh_token', tokens.refresh_token, {
            httpOnly: true,
            secure,
            sameSite: 'lax',
            maxAge,
            path: '/'
        });

        cookieStore.set('yahoo_token_expires_at', expires_at.toString(), {
            httpOnly: true,
            secure,
            sameSite: 'lax',
            maxAge,
            path: '/'
        });

        // Redirect back to fantasy page with success
        const redirectUrl = new URL('/fantasy?success=true', request.url);
        redirectUrl.port = '3003'; // Ensure we redirect to the HTTPS port
        return NextResponse.redirect(redirectUrl);

    } catch (error) {
        console.error('Auth Error:', error);
        const redirectUrl = new URL('/fantasy?error=auth_failed', request.url);
        redirectUrl.port = '3003'; // Ensure we redirect to the HTTPS port
        return NextResponse.redirect(redirectUrl);
    }
} 