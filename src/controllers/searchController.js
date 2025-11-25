const asyncHandler = require('express-async-handler');
const { searchBooks } = require('../services/bookService'); // Open Library API search
const { searchLocal } = require('../services/localSearchService'); // Local DB search
const redisClient = require('../services/cacheService');

const getSearchPage = asyncHandler(async (req, res) => {
    const query = req.query.q;
    let apiBooks = [];
    let localBooks = [];
    let localNotes = [];
    let errors = [];

    if (query) {
        try {
            // Try to get data from cache first
            const cachedBooks = await redisClient.get(`search:${query}`);
            if (cachedBooks) {
                apiBooks = JSON.parse(cachedBooks);
            } else {
                // If not in cache, fetch from API and cache it
                apiBooks = await searchBooks(query);
                // Cache for 1 hour
                await redisClient.set(`search:${query}`, JSON.stringify(apiBooks), {
                    EX: 3600,
                });
            }
        } catch (error) {
            errors.push(error.message);
        }

        try {
            // Perform local database search (only for logged-in users)
            if (req.session.user) {
                const localResults = await searchLocal(query, req.session.user.id);
                localBooks = localResults.books;
                localNotes = localResults.notes;
            }
        } catch (error) {
            errors.push(`Local search failed: ${error.message}`);
        }
    }

    res.render('search', {
        title: 'Search Books',
        apiBooks, // Renamed from 'books' to avoid conflict
        localBooks,
        localNotes,
        query,
        errors,
    });
});

module.exports = {
    getSearchPage,
};

