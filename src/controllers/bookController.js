const asyncHandler = require('express-async-handler');
const pool = require('../db/pool');
const cache = require('../services/cacheService');

const getLibrary = asyncHandler(async (req, res) => {
    const userId = req.session.user.id;
    const defaultSort = req.session.user.preferences?.defaultSort || 'title_asc';
    const { sort = defaultSort, filter = '', page = 1, tag = '', error } = req.query;

    const itemsPerPage = 12;
    const offset = (page - 1) * itemsPerPage;

    const errors = [];
    if (error === 'duplicate_book') {
        errors.push("Great taste! You already picked this one. (Already added in your library)");
    }

    const sortOptions = {
        title_asc: 'b.title ASC',
        title_desc: 'b.title DESC',
        author_asc: 'b.author ASC',
        author_desc: 'b.author DESC',
    };
    const orderBy = sortOptions[sort] || sortOptions.title_asc;

    // --- Build Query ---
    let whereClauses = ['ub.user_id = $1'];
    const queryParams = [userId];
    let joins = 'JOIN users_books ub ON b.id = ub.book_id';

    if (filter) {
        queryParams.push(`%${filter}%`);
        whereClauses.push(`(b.title ILIKE $${queryParams.length} OR b.author ILIKE $${queryParams.length})`);
    }

    if (tag) {
        queryParams.push(tag);
        joins += `
            JOIN notes n ON b.id = n.book_id AND n.user_id = ub.user_id
            JOIN notes_tags nt ON n.id = nt.note_id
            JOIN tags t ON nt.tag_id = t.id
        `;
        whereClauses.push(`t.tag_name = $${queryParams.length}`);
    }

    const whereClause = `WHERE ${whereClauses.join(' AND ')}`;

    // --- Fetch Data ---

    // Query for all unique tags for this user
    const tagsQuery = `
        SELECT DISTINCT t.tag_name
        FROM tags t
        JOIN notes_tags nt ON t.id = nt.tag_id
        JOIN notes n ON nt.note_id = n.id
        WHERE n.user_id = $1
        ORDER BY t.tag_name
    `;
    const allTagsResult = await pool.query(tagsQuery, [userId]);

    // Query for the total count of items
    const countQuery = `SELECT COUNT(DISTINCT b.id) FROM books b ${joins} ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Query for the paginated, filtered, and sorted items
    const limitPlaceholder = `${queryParams.length + 1}`;
    const offsetPlaceholder = `${queryParams.length + 2}`;
    const libraryQuery = `
        SELECT DISTINCT b.id, b.title, b.author, b.cover_image_url
        FROM books b
        ${joins}
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${limitPlaceholder} OFFSET $${offsetPlaceholder}
    `;
    const libraryResult = await pool.query(libraryQuery, [...queryParams, itemsPerPage, offset]);

    // --- Render Page ---
    res.render('books', {
        title: 'My Library',
        books: libraryResult.rows,
        totalPages,
        currentPage: parseInt(page, 10),
        sort,
        filter,
        tag,
        allTags: allTagsResult.rows,
        errors,
    });
});

const addBook = asyncHandler(async (req, res) => {
    const { api_id, title, authors, thumbnail } = req.body;
    const userId = req.session.user.id;

    await pool.query('BEGIN');
    try {
        let bookResult = await pool.query('SELECT id FROM books WHERE api_id = $1', [api_id]);
        let bookId;

        if (bookResult.rows.length > 0) {
            bookId = bookResult.rows[0].id;
        } else {
            const newBookResult = await pool.query(
                'INSERT INTO books (api_id, title, author, cover_image_url) VALUES ($1, $2, $3, $4) RETURNING id',
                [api_id, title, authors, thumbnail]
            );
            bookId = newBookResult.rows[0].id;
        }

        const associationResult = await pool.query(
            'SELECT * FROM users_books WHERE user_id = $1 AND book_id = $2',
            [userId, bookId]
        );

        if (associationResult.rows.length === 0) {
            await pool.query(
                'INSERT INTO users_books (user_id, book_id) VALUES ($1, $2)',
                [userId, bookId]
            );
            // Log this activity
            await pool.query(
                'INSERT INTO activity_log (user_id, action_type, book_id) VALUES ($1, $2, $3)',
                [userId, 'added_book', bookId]
            );
        } else {
            await pool.query('COMMIT');
            
            if (req.headers.accept && req.headers.accept.includes('application/json')) {
                return res.status(409).json({ success: false, message: "Great taste! You already picked this one. (Already added in your library)" });
            }

            if (req.body.source === 'search') {
                const query = req.body.q ? encodeURIComponent(req.body.q) : '';
                return res.redirect(`/search?q=${query}&error=duplicate_book`);
            }
            return res.redirect('/books?error=duplicate_book');
        }

        await pool.query('COMMIT');

        // Invalidate recommendation cache for this user so new recommendations are generated
        cache.del(`recommendations_${userId}`);

        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({ success: true, message: "Excellent choice! Added to your shelf." });
        }

        if (req.body.source === 'search') {
            const query = req.body.q ? encodeURIComponent(req.body.q) : '';
            return res.redirect(`/search?q=${query}&success=book_added`);
        }

        res.redirect('/books');
    } catch (err) {
        await pool.query('ROLLBACK');
        // Re-throw the error to be caught by the async error handler
        throw err;
    }
});

module.exports = {
    getLibrary,
    addBook,
};