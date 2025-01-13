'use client';

import { useEffect, useState } from 'react';
import type { League } from '@/app/api/fantasy/leagues/route';

interface LeagueSelectorProps {
    selectedLeague?: string;
    onLeagueSelect: (leagueKey: string | undefined) => void;
}

export default function LeagueSelector({ selectedLeague, onLeagueSelect }: LeagueSelectorProps) {
    const [leagues, setLeagues] = useState<League[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchLeagues() {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/fantasy/leagues');
                if (!response.ok) {
                    throw new Error('Failed to fetch leagues');
                }

                const data = await response.json();
                if ('error' in data) {
                    throw new Error(data.error);
                }

                // Sort leagues by season (descending) and name
                const sortedLeagues = data.leagues.sort((a: League, b: League) => {
                    if (a.season !== b.season) {
                        return parseInt(b.season) - parseInt(a.season);
                    }
                    return a.name.localeCompare(b.name);
                });

                setLeagues(sortedLeagues);

                // If no league is selected and we have active leagues, select the first active one
                if (!selectedLeague && sortedLeagues.length > 0) {
                    const activeLeague = sortedLeagues.find(l => l.is_active);
                    if (activeLeague) {
                        onLeagueSelect(activeLeague.league_key);
                    }
                }
            } catch (err) {
                console.error('League Fetch Error:', err);
                setError(err instanceof Error ? err.message : 'Failed to load leagues');
            } finally {
                setIsLoading(false);
            }
        }

        fetchLeagues();
    }, [selectedLeague, onLeagueSelect]);

    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded w-48"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-sm">
                {error}
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-2">
            <select
                value={selectedLeague || ''}
                onChange={(e) => onLeagueSelect(e.target.value || undefined)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
                <option value="">All Leagues</option>
                {leagues.map((league) => (
                    <option 
                        key={league.league_key} 
                        value={league.league_key}
                        className={league.is_active ? 'font-medium' : 'text-gray-500'}
                    >
                        {league.name} ({league.season})
                        {league.is_active ? ' - Active' : ''}
                    </option>
                ))}
            </select>
        </div>
    );
} 