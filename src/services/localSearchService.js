const pool = require('../db/pool');

/**
 * Performs a full-text search across local books and notes.
 * @param {string} query The search query.
 * @param {number} userId The ID of the current user to filter notes.
 * @returns {Promise<Array>} A promise that resolves to an array of local search results.
 */
async function searchLocal(query, userId) {
    const searchTerm = query.split(/\s+/).filter(Boolean).join(' & '); // Convert to tsquery format
    
    // Search books
    const bookResults = await pool.query(
        `SELECT 
            id, title, author, cover_image_url,
            ts_rank(search_vector, to_tsquery('english', $1)) as rank
        FROM books
        WHERE search_vector @@ to_tsquery('english', $1)
        ORDER BY rank DESC
        LIMIT 5`, // Limit local book results
        [searchTerm]
    );

    // Search notes
    const noteResults = await pool.query(
        `SELECT 
            n.id as note_id, n.content_markdown, n.excerpt, n.page, n.chapter, n.created_at, n.share_slug,
            b.id as book_id, b.title as book_title, b.author as book_author, b.cover_image_url,
            ts_rank(n.search_vector, to_tsquery('english', $1)) as rank
        FROM notes n
        JOIN books b ON n.book_id = b.id
        WHERE n.user_id = $2 AND n.search_vector @@ to_tsquery('english', $1)
        ORDER BY rank DESC
        LIMIT 10`, // Limit local note results
        [searchTerm, userId]
    );

    return {
        books: bookResults.rows,
        notes: noteResults.rows,
    };
}

module.exports = {
    searchLocal,
};
