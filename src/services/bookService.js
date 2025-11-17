const axios = require('axios');
const cache = require('./cacheService');

const BASE_URL = 'https://openlibrary.org/search.json';

/**
 * Searches for books using the Open Library API.
 * @param {string} query The search query.
 * @returns {Promise<Array>} A promise that resolves to an array of book items.
 */
async function searchBooks(query) {
    const cacheKey = `search_ol_${query}`;
    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
        console.log(`[Cache] HIT for query: ${query}`);
        return cachedResult;
    }

    console.log(`[API] MISS for query: ${query}. Fetching from Open Library.`);

    try {
        const response = await axios.get(BASE_URL, {
            params: {
                q: query,
                limit: 20,
            },
        });

        // Extract relevant data from the API response
        const books = response.data.docs ? response.data.docs.map(doc => ({
            // Open Library doesn't have a stable ID for a book edition, so we use the work key
            id: doc.key, 
            title: doc.title,
            authors: doc.author_name || ['N/A'],
            // Open Library search doesn't provide a description.
            description: 'No description available from Open Library search.',
            // Construct thumbnail URL from cover ID
            thumbnail: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
        })) : [];

        cache.set(cacheKey, books);
        return books;
    } catch (error) {
        console.error('Error fetching from Open Library API:', error.message);
        throw new Error('Failed to fetch books from Open Library API.');
    }
}

module.exports = {
    searchBooks,
};
