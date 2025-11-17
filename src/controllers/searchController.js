const asyncHandler = require('express-async-handler');
const { searchBooks } = require('../services/bookService'); // Open Library API search
const { searchLocal } = require('../services/localSearchService'); // Local DB search

const getSearchPage = asyncHandler(async (req, res) => {
    const query = req.query.q;
    let apiBooks = [];
    let localBooks = [];
    let localNotes = [];
    let errors = [];

    if (query) {
        try {
            // Perform Open Library API search
            apiBooks = await searchBooks(query);
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
