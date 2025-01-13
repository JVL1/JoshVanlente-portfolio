'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PlayerSearch from './components/PlayerSearch';

export default function FantasyPage() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Check for error or success messages in URL
        const urlError = searchParams.get('error');
        const success = searchParams.get('success');

        if (urlError) {
            setError(decodeURIComponent(urlError));
        } else if (success) {
            setError(null);
        }

        async function checkAuth() {
            try {
                const response = await fetch('/api/fantasy/check-auth');
                const data = await response.json();
                setIsAuthenticated(data.authenticated);
                if (data.authenticated) {
                    setError(null);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                setIsAuthenticated(false);
                setError('Failed to check authentication status');
            }
        }

        checkAuth();
    }, [searchParams]);

    if (isAuthenticated === null) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <h1 className="text-2xl font-bold">Yahoo Fantasy Sports Integration</h1>
                <p className="text-gray-600">Please authenticate with Yahoo to access fantasy sports data.</p>
                {error && (
                    <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                        {error}
                    </div>
                )}
                <button 
                    onClick={() => {
                        const redirectUrl = new URL('/api/fantasy/yahoo-auth', window.location.href);
                        redirectUrl.port = '3003';
                        router.push(redirectUrl.toString());
                    }}
                    className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Connect Yahoo Account
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-8">Yahoo Fantasy Sports</h1>
            <PlayerSearch />
        </div>
    );
} 