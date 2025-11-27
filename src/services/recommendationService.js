const pool = require('../db/pool');
const cache = require('./cacheService');
const { searchBooks } = require('./bookService'); // To fetch new books from Open Library

const RECOMMENDATION_CACHE_TTL = 60 * 60 * 24; // Cache recommendations for 24 hours

/**
 * Generates book recommendations for a given user.
 * @param {number} userId The ID of the user.
 * @returns {Promise<Array>} A promise that resolves to an array of recommended book objects.
 */
async function getRecommendations(userId) {
    const cacheKey = `recommendations_${userId}`;
    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
        console.log(`[Cache] HIT for recommendations for user: ${userId}`);
        return cachedResult;
    }

    console.log(`[API] MISS for recommendations for user: ${userId}. Generating...`);

    // 1. Get user's 3 most recent book titles
    const userTitlesResult = await pool.query(
        `SELECT b.title
         FROM books b
         JOIN users_books ub ON b.id = ub.book_id
         WHERE ub.user_id = $1
         ORDER BY ub.book_id DESC
         LIMIT 3`,
        [userId]
    );
    const userTitles = userTitlesResult.rows.map(row => row.title);

    // 2. Get user's top 3 most frequent authors
    const userAuthorsResult = await pool.query(
        `SELECT b.author, COUNT(ub.book_id) as author_count
         FROM books b
         JOIN users_books ub ON b.id = ub.book_id
         WHERE ub.user_id = $1 AND b.author IS NOT NULL
         GROUP BY b.author
         ORDER BY author_count DESC
         LIMIT 3`,
        [userId]
    );
    const userAuthors = userAuthorsResult.rows.map(row => row.author);

    let recommendedBooks = [];
    const seenApiIds = new Set(); // To avoid duplicate recommendations

    // Recommend based on authors
    for (const author of userAuthors) {
        try {
            const searchResults = await searchBooks(author);
            searchResults.forEach(book => {
                if (!seenApiIds.has(book.id)) {
                    recommendedBooks.push(book);
                    seenApiIds.add(book.id);
                }
            });
        } catch (e) { console.error(`Error searching for author ${author}:`, e.message); }
        if (recommendedBooks.length >= 15) break; 
    }

    // Recommend based on titles (if we need more)
    if (recommendedBooks.length < 15) {
        for (const title of userTitles) {
            try {
                const searchResults = await searchBooks(title);
                searchResults.forEach(book => {
                    if (!seenApiIds.has(book.id)) {
                        recommendedBooks.push(book);
                        seenApiIds.add(book.id);
                    }
                });
            } catch (e) { console.error(`Error searching for title ${title}:`, e.message); }
            if (recommendedBooks.length >= 15) break;
        }
    }

    // Filter out books already in the user's library
    const userLibraryBooks = await pool.query(
        'SELECT api_id FROM books b JOIN users_books ub ON b.id = ub.book_id WHERE ub.user_id = $1',
        [userId]
    );
    const libraryApiIds = new Set(userLibraryBooks.rows.map(row => row.api_id));

    recommendedBooks = recommendedBooks.filter(book => !libraryApiIds.has(book.id));

    // Limit to a reasonable number
    recommendedBooks = recommendedBooks.slice(0, 10);

    cache.set(cacheKey, recommendedBooks, RECOMMENDATION_CACHE_TTL);
    return recommendedBooks;
}

module.exports = {
    getRecommendations,
};
