'use client';

import { useEffect, useState } from 'react';
import { Button, Flex, Heading, Text } from '@/once-ui/components';
import { Player } from '@/lib/fantasy/types';

export default function FantasyPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check if we have a valid token
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/fantasy/check-auth');
                const data = await response.json();
                setIsAuthenticated(data.authenticated);
            } catch (error) {
                console.error('Auth check failed:', error);
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, []);

    const handleAuth = async () => {
        window.location.href = '/api/fantasy/yahoo-auth';
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/fantasy/player-search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to search players');
            }

            setPlayers(data.players);
        } catch (error: any) {
            setError(error.message);
            setPlayers([]);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <Flex
                direction="column"
                alignItems="center"
                gap="l"
                padding="xl">
                <Heading variant="display-strong-l">
                    Fantasy Football Analysis
                </Heading>
                <Text variant="body-default-l">
                    Connect with Yahoo Fantasy to access player analysis
                </Text>
                <Button
                    onClick={handleAuth}
                    variant="primary"
                    size="l">
                    Connect with Yahoo
                </Button>
            </Flex>
        );
    }

    return (
        <Flex
            direction="column"
            gap="l"
            padding="xl">
            <Heading variant="display-strong-l">
                Player Analysis
            </Heading>

            <Flex gap="m">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a player..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full px-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                    onClick={handleSearch}
                    variant="primary"
                    loading={loading}>
                    Search
                </Button>
            </Flex>

            {error && (
                <Text color="error">
                    {error}
                </Text>
            )}

            <Flex direction="column" gap="m">
                {players.map((player) => (
                    <Flex
                        key={player.player_id}
                        padding="l"
                        background="surface"
                        radius="m"
                        direction="column"
                        gap="s">
                        <Text variant="heading-strong-l">
                            {player.name.full}
                        </Text>
                        <Flex gap="m">
                            <Text variant="body-default-m">
                                {player.position}
                            </Text>
                            <Text variant="body-default-m">
                                {player.team}
                            </Text>
                            <Text variant="body-default-m">
                                {player.status}
                            </Text>
                        </Flex>
                        {player.stats && (
                            <Text variant="body-default-m">
                                Stats: {JSON.stringify(player.stats)}
                            </Text>
                        )}
                    </Flex>
                ))}
            </Flex>
        </Flex>
    );
} 