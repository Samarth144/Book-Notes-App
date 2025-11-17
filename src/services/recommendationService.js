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

    // 1. Get user's most frequent tags
    const userTagsResult = await pool.query(
        `SELECT t.tag_name, COUNT(nt.tag_id) as tag_count
         FROM notes n
         JOIN notes_tags nt ON n.id = nt.note_id
         JOIN tags t ON nt.tag_id = t.id
         WHERE n.user_id = $1
         GROUP BY t.tag_name
         ORDER BY tag_count DESC
         LIMIT 5`,
        [userId]
    );
    const userTags = userTagsResult.rows.map(row => row.tag_name);

    // 2. Get user's most frequent authors
    const userAuthorsResult = await pool.query(
        `SELECT b.author, COUNT(ub.book_id) as author_count
         FROM books b
         JOIN users_books ub ON b.id = ub.book_id
         WHERE ub.user_id = $1 AND b.author IS NOT NULL
         GROUP BY b.author
         ORDER BY author_count DESC
         LIMIT 5`,
        [userId]
    );
    const userAuthors = userAuthorsResult.rows.map(row => row.author);

    let recommendedBooks = [];
    const seenApiIds = new Set(); // To avoid duplicate recommendations

    // Recommend based on tags
    for (const tag of userTags) {
        const searchResults = await searchBooks(tag); // Use Open Library search
        searchResults.forEach(book => {
            if (!seenApiIds.has(book.id)) {
                recommendedBooks.push(book);
                seenApiIds.add(book.id);
            }
        });
        if (recommendedBooks.length >= 10) break; // Limit total recommendations
    }

    // Recommend based on authors (if we still need more)
    if (recommendedBooks.length < 10) {
        for (const author of userAuthors) {
            const searchResults = await searchBooks(author);
            searchResults.forEach(book => {
                if (!seenApiIds.has(book.id)) {
                    recommendedBooks.push(book);
                    seenApiIds.add(book.id);
                }
            });
            if (recommendedBooks.length >= 10) break;
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
