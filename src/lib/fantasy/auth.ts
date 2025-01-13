import { cookies } from 'next/headers';
import type { TokenStore } from './types';

const TOKEN_COOKIE_NAME = 'yahoo_token';
const REFRESH_TOKEN_COOKIE_NAME = 'yahoo_refresh_token';
const EXPIRES_AT_COOKIE_NAME = 'yahoo_token_expires_at';

export function storeTokens(tokens: TokenStore): void {
    const cookieStore = cookies();
    const secure = process.env.NODE_ENV === 'production';
    const maxAge = 30 * 24 * 60 * 60; // 30 days

    // Store tokens in HTTP-only cookies
    cookieStore.set(TOKEN_COOKIE_NAME, tokens.access_token, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        maxAge,
        path: '/'
    });

    cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refresh_token, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        maxAge,
        path: '/'
    });

    cookieStore.set(EXPIRES_AT_COOKIE_NAME, tokens.expires_at.toString(), {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        maxAge,
        path: '/'
    });
}

export function getStoredTokens(): TokenStore | null {
    const cookieStore = cookies();
    const accessToken = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
    const expiresAt = cookieStore.get(EXPIRES_AT_COOKIE_NAME)?.value;

    if (!accessToken || !refreshToken || !expiresAt) {
        return null;
    }

    return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: parseInt(expiresAt, 10)
    };
}

export function clearTokens(): void {
    const cookieStore = cookies();
    cookieStore.delete(TOKEN_COOKIE_NAME);
    cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME);
    cookieStore.delete(EXPIRES_AT_COOKIE_NAME);
}

export function isTokenExpired(tokens: TokenStore): boolean {
    // Add a 5-minute buffer to handle clock skew
    const bufferTime = 5 * 60 * 1000;
    return Date.now() >= tokens.expires_at - bufferTime;
}

export function calculateExpiresAt(expiresIn: number): number {
    return Date.now() + expiresIn * 1000;
} 