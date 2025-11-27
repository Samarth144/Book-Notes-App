const asyncHandler = require('express-async-handler');
const { searchBooks } = require('../services/bookService'); // Open Library API search
const { searchLocal, getTrendingSearches } = require('../services/localSearchService'); // Local DB search
const { getRecommendations } = require('../services/recommendationService');
const redisClient = require('../services/cacheService');

const getSearchPage = asyncHandler(async (req, res) => {
    const { q: query, error, success } = req.query;
    let apiBooks = [];
    let localBooks = [];
    let localNotes = [];
    let recommendations = [];
    let errors = [];
    let messages = [];

    // Fetch trending searches regardless of query
    const trendingSearches = await getTrendingSearches();

    // Fetch recommendations if user is logged in
    if (req.session.user) {
        try {
            recommendations = await getRecommendations(req.session.user.id);
        } catch (err) {
            console.error("Failed to fetch recommendations:", err);
            // Don't block the page load if recommendations fail
        }
    }

    if (error === 'duplicate_book') {
        errors.push("Great taste! You already picked this one. (Already added in your library)");
    }

    if (success === 'book_added') {
        messages.push("Excellent choice! Added to your shelf.");
    }

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
        messages,
        trendingSearches, // Pass trending searches to the template
        recommendations,
    });
});

module.exports = {
    getSearchPage,
};

