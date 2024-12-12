import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import { Player } from './types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index('fantasy-football');

function flattenStats(stats: any): Record<string, string | number> {
    if (!stats) return {};

    const flattened: Record<string, string | number> = {};
    
    // Flatten season stats
    if (stats.stats) {
        Object.entries(stats.stats).forEach(([key, value]) => {
            flattened[`stat_${key}`] = value as number;
        });
    }

    // Flatten projected stats
    if (stats.projected) {
        Object.entries(stats.projected).forEach(([key, value]) => {
            flattened[`projected_${key}`] = value as number;
        });
    }

    // Add season
    if (stats.season) {
        flattened.season = stats.season;
    }

    return flattened;
}

export async function storePlayerData(player: Player) {
    try {
        // Create a text representation of the player data
        const playerText = `
            Player: ${player.name.full}
            Team: ${player.team}
            Position: ${player.position}
            Status: ${player.status}
            Stats: ${JSON.stringify(player.stats)}
        `;

        // Generate embeddings using OpenAI
        const embedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: playerText,
            encoding_format: "float",
        });

        // Prepare metadata with flattened stats
        const metadata = {
            name: player.name.full,
            firstName: player.name.first,
            lastName: player.name.last,
            team: player.team,
            position: player.position,
            status: player.status,
            ...flattenStats(player.stats)
        };

        // Store in Pinecone
        await index.upsert([{
            id: player.player_id,
            values: embedding.data[0].embedding,
            metadata
        }]);

        return true;
    } catch (error) {
        console.error('Error storing player data:', error);
        throw error;
    }
}

export async function searchSimilarPlayers(query: string, limit: number = 5) {
    try {
        // Generate embedding for the search query
        const queryEmbedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: query,
            encoding_format: "float",
        });

        // Search Pinecone
        const results = await index.query({
            vector: queryEmbedding.data[0].embedding,
            topK: limit,
            includeMetadata: true,
        });

        // Convert metadata back to Player format
        return results.matches.map(match => {
            const metadata = match.metadata as Record<string, string | number>;
            
            // Reconstruct stats from flattened metadata
            const stats = {
                season: metadata.season as string,
                stats: {},
                projected: {}
            };

            // Extract regular stats
            Object.entries(metadata).forEach(([key, value]) => {
                if (key.startsWith('stat_')) {
                    stats.stats[key.replace('stat_', '')] = value as number;
                } else if (key.startsWith('projected_')) {
                    stats.projected[key.replace('projected_', '')] = value as number;
                }
            });

            const player: Player = {
                player_id: match.id,
                name: {
                    full: metadata.name as string,
                    first: metadata.firstName as string,
                    last: metadata.lastName as string
                },
                team: metadata.team as string,
                position: metadata.position as string,
                status: metadata.status as string,
                stats: stats
            };

            return {
                score: match.score,
                player
            };
        });
    } catch (error) {
        console.error('Error searching players:', error);
        throw error;
    }
}

export async function getPlayerEmbedding(playerId: string) {
    try {
        const result = await index.fetch([playerId]);
        return result.records[playerId];
    } catch (error) {
        console.error('Error fetching player embedding:', error);
        throw error;
    }
} 