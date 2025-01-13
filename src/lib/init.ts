import { initializePineconeIndex } from './fantasy/pinecone';

let initialized = false;

export async function initializeApp() {
    if (initialized) return;
    
    try {
        console.log('Initializing app...');
        
        // Initialize Pinecone
        await initializePineconeIndex();
        
        console.log('App initialization complete');
        initialized = true;
    } catch (error) {
        console.error('Error during app initialization:', error);
        throw error;
    }
} 