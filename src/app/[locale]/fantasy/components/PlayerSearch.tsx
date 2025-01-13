'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import type { Player } from '@/lib/fantasy/types';
import PlayerCard from './PlayerCard';
import LeagueSelector from './LeagueSelector';

export default function PlayerSearch() {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 500);
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [selectedLeague, setSelectedLeague] = useState<string>();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function searchPlayers() {
            if (!debouncedQuery) {
                setPlayers([]);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/fantasy/player-search?q=${encodeURIComponent(debouncedQuery)}`);
                if (!response.ok) {
                    throw new Error('Failed to search players');
                }

                const data = await response.json();

                if ('error' in data) {
                    throw new Error(data.error);
                }

                if (!data.players || !Array.isArray(data.players)) {
                    console.error('Unexpected data format:', data);
                    throw new Error('Invalid response format');
                }

                setPlayers(data.players);
            } catch (err) {
                console.error('Search Error:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
                setPlayers([]);
            } finally {
                setIsLoading(false);
            }
        }

        searchPlayers();
    }, [debouncedQuery]);

    const handlePlayerSelect = async (player: Player) => {
        setIsLoadingStats(true);
        setError(null);

        try {
            const url = new URL('/api/fantasy/player-stats', window.location.origin);
            url.searchParams.set('player_key', player.player_key);
            if (selectedLeague) {
                url.searchParams.set('league_key', selectedLeague);
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch player stats');
            }

            const playerWithStats = await response.json();
            if ('error' in playerWithStats) {
                throw new Error(playerWithStats.error);
            }

            setSelectedPlayer(playerWithStats);
            setQuery(''); // Clear the search when a player is selected
            setPlayers([]); // Clear the search results
        } catch (err) {
            console.error('Stats Error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load player stats');
        } finally {
            setIsLoadingStats(false);
        }
    };

    const handleLeagueChange = (leagueKey: string | undefined) => {
        setSelectedLeague(leagueKey);
        // If we have a selected player, refresh their stats with the new league
        if (selectedPlayer) {
            handlePlayerSelect(selectedPlayer);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4">
            {/* League Selector */}
            <div className="mb-6">
                <label htmlFor="league" className="block text-sm font-medium text-gray-700 mb-2">
                    Select League
                </label>
                <LeagueSelector
                    selectedLeague={selectedLeague}
                    onLeagueSelect={handleLeagueChange}
                />
            </div>

            {/* Show either the search input or the player card */}
            {!selectedPlayer ? (
                <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                        <input
                            type="search"
                            placeholder="Search for players..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}
                    </div>

                    {/* Search Results */}
                    <div className="space-y-2">
                        {isLoading ? (
                            // Loading skeletons
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="h-20 bg-gray-200 rounded-lg p-4">
                                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))
                        ) : players.length > 0 ? (
                            // Player results
                            players.map((player) => (
                                <div 
                                    key={player.player_id}
                                    onClick={() => handlePlayerSelect(player)}
                                    className="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center"
                                >
                                    <div>
                                        <h3 className="font-semibold">{player.name.full}</h3>
                                        <p className="text-sm text-gray-600">
                                            {player.team} - {player.position}
                                        </p>
                                    </div>
                                    {player.injury_status && (
                                        <span className="text-red-500 text-sm font-medium">
                                            {player.injury_status}
                                        </span>
                                    )}
                                </div>
                            ))
                        ) : query && !isLoading ? (
                            <p className="text-center text-gray-500">No players found</p>
                        ) : null}
                    </div>
                </div>
            ) : (
                <div className="relative">
                    {isLoadingStats ? (
                        <div className="animate-pulse">
                            <div className="h-64 bg-gray-200 rounded-lg"></div>
                        </div>
                    ) : (
                        <PlayerCard 
                            player={selectedPlayer} 
                            onClose={() => {
                                setSelectedPlayer(null);
                                setQuery('');
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
} 