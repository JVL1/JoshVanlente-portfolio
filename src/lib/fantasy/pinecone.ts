import { Pinecone } from '@pinecone-database/pinecone';

type RecordMetadataValue = string | number | boolean | string[];

export interface PlayerStatsMetadata {
    player_key: string;
    player_name: string;
    firstName: string;
    lastName: string;
    team: string;
    position: string;
    season: string;
    week?: number;
    league_key?: string;
    status: string;
    // Flattened stats fields
    receiving_yards: number;
    receiving_touchdowns: number;
    receiving_receptions: number;
    receiving_targets: number;
    rushing_yards: number;
    rushing_touchdowns: number;
    rushing_attempts: number;
    passing_yards: number;
    passing_touchdowns: number;
    passing_interceptions: number;
    passing_attempts: number;
    passing_completions: number;
    raw_stats: string; // JSON stringified full stats
    fantasy_points: number;
    timestamp: number;
}

export interface PlayerStatsVector {
    id: string;
    values: number[];
    metadata: Record<string, RecordMetadataValue>;
}

if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not set');
}

if (!process.env.PINECONE_ENVIRONMENT) {
    throw new Error('PINECONE_ENVIRONMENT is not set');
}

// Extract region from environment (e.g., "us-east-1-aws" -> "us-east-1")
const region = process.env.PINECONE_ENVIRONMENT.split('-aws')[0];

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

const INDEX_NAME = 'fantasy-football-stats';

export async function initializePineconeIndex() {
    try {
        // Wait for index to be ready
        await waitForIndex();
        console.log('Pinecone index is ready');
    } catch (error) {
        console.error('Error initializing Pinecone index:', error);
        throw error;
    }
}

async function waitForIndex(maxAttempts = 10, delayMs = 2000) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        try {
            const indexList = await pinecone.listIndexes();
            
            // Check if index exists
            if (!indexList.indexes?.some(index => index.name === INDEX_NAME)) {
                console.log('Creating Pinecone index...');
                await pinecone.createIndex({
                    name: INDEX_NAME,
                    dimension: 128,
                    metric: 'cosine',
                    spec: {
                        serverless: {
                            cloud: 'aws',
                            region: region
                        }
                    }
                });
                
                // Wait for index to be ready
                await new Promise(resolve => setTimeout(resolve, delayMs));
                continue;
            }

            // Get index status using describe method
            const indexDescription = await pinecone.describeIndex(INDEX_NAME);
            
            if (indexDescription.status?.state === 'Ready') {
                console.log('Index is ready:', indexDescription);
                return;
            }

            console.log('Waiting for index to be ready...', indexDescription.status);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            attempts++;
        } catch (error) {
            console.error('Error checking index status:', error);
            attempts++;
            if (attempts === maxAttempts) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    throw new Error('Index failed to become ready in time');
}

export async function storePlayerStats(
    playerKey: string,
    playerName: string,
    team: string,
    position: string,
    stats: Record<string, number>,
    fantasyPoints: number,
    season: string,
    week?: number,
    leagueKey?: string,
    status: string = 'Active',
    firstName: string = '',
    lastName: string = ''
) {
    try {
        // Make sure index is initialized
        await initializePineconeIndex();
        
        const index = pinecone.index(INDEX_NAME);

        // Generate embedding for the stats
        const embedding = await generateStatsEmbedding(stats);

        const metadata: Record<string, RecordMetadataValue> = {
            player_key: playerKey,
            player_name: playerName,
            firstName,
            lastName,
            team,
            position,
            season,
            status,
            receiving_yards: stats['12'] || 0,
            receiving_touchdowns: stats['13'] || 0,
            receiving_receptions: stats['11'] || 0,
            receiving_targets: stats['78'] || 0,
            rushing_yards: stats['9'] || 0,
            rushing_touchdowns: stats['10'] || 0,
            rushing_attempts: stats['8'] || 0,
            passing_yards: stats['4'] || 0,
            passing_touchdowns: stats['5'] || 0,
            passing_interceptions: stats['6'] || 0,
            passing_attempts: stats['1'] || 0,
            passing_completions: stats['2'] || 0,
            raw_stats: JSON.stringify(stats),
            fantasy_points: fantasyPoints,
            timestamp: Date.now()
        };

        if (week !== undefined) {
            metadata.week = week;
        }
        if (leagueKey !== undefined) {
            metadata.league_key = leagueKey;
        }

        const vector: PlayerStatsVector = {
            id: `${playerKey}_${season}_${week || 'season'}`,
            values: embedding,
            metadata
        };

        await index.upsert([vector]);
        console.log(`Stored stats for ${playerName} (${season} Week ${week || 'Season'})`);
    } catch (error) {
        console.error('Error storing player stats:', error);
        throw error;
    }
}

async function generateStatsEmbedding(stats: Record<string, number>): Promise<number[]> {
    // Convert stats to array and ensure we have non-zero values
    const statValues = Object.entries(stats).map(([key, value]) => ({
        key,
        value: value || 0.0001 // Ensure no exact zeros
    }));

    // Calculate total for normalization
    const total = statValues.reduce((sum, stat) => sum + stat.value, 0);

    // Create normalized values
    const normalized = statValues.map(stat => stat.value / (total || 1));

    // Create embedding with stat values and position encoding
    const embedding = new Array(128).fill(0.0001); // Fill with small non-zero values
    
    // Place normalized values in first half of embedding
    normalized.forEach((value, index) => {
        if (index < 64) { // Use first half for actual stats
            embedding[index] = value;
        }
    });

    // Add position encoding in second half
    statValues.forEach(({ key }, index) => {
        if (index < 64) { // Use second half for position encoding
            const position = index / 63; // Normalize position to 0-1
            embedding[64 + index] = 0.1 + (0.9 * position); // Ensure non-zero values
        }
    });

    return embedding;
}

export async function predictFantasyPoints(
    position: string,
    stats: Record<string, number>,
    season: string,
    week?: number
): Promise<number> {
    try {
        const index = pinecone.index(INDEX_NAME);
        
        // Generate embedding for the input stats
        const embedding = await generateStatsEmbedding(stats);
        
        // Query Pinecone for similar performances
        const queryResponse = await index.query({
            vector: embedding,
            filter: {
                position: { $eq: position },
                season: { $eq: season },
                ...(week ? { week: { $eq: week } } : {})
            },
            topK: 5,
            includeMetadata: true
        });

        const similarPerformances = queryResponse.matches || [];
        
        if (similarPerformances.length === 0) {
            console.log('No similar performances found');
            return 0;
        }

        // Calculate predicted points based on similar performances
        const predictedPoints = similarPerformances.reduce((sum, match) => {
            const metadata = match.metadata as unknown as PlayerStatsMetadata;
            return sum + (typeof metadata.fantasy_points === 'number' ? metadata.fantasy_points : 0);
        }, 0) / similarPerformances.length;

        return predictedPoints;
    } catch (error) {
        console.error('Error predicting fantasy points:', error);
        throw error;
    }
}