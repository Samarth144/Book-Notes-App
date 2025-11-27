const asyncHandler = require('express-async-handler');
const pool = require('../db/pool');
const { marked } = require('marked');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Helper function to convert and sanitize markdown
const sanitizeMarkdown = (markdown) => {
    const dirtyHtml = marked.parse(markdown);
    return DOMPurify.sanitize(dirtyHtml);
};

// Get the notes page for a specific book
const getNotesForBook = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const userId = req.session.user.id;

    const bookResult = await pool.query('SELECT * FROM books WHERE id = $1', [bookId]);
    if (bookResult.rows.length === 0) {
        res.status(404);
        throw new Error('Book not found.');
    }
    const book = bookResult.rows[0];

    // Join with tags to get a comma-separated list of tags for each note
    const notesQuery = `
        SELECT n.*, COALESCE(string_agg(t.tag_name, ', '), '') as tags
        FROM notes n
        LEFT JOIN notes_tags nt ON n.id = nt.note_id
        LEFT JOIN tags t ON nt.tag_id = t.id
        WHERE n.user_id = $1 AND n.book_id = $2
        GROUP BY n.id
        ORDER BY n.created_at DESC
    `;
    const notesResult = await pool.query(notesQuery, [userId, bookId]);
    const notes = notesResult.rows;

    res.render('notes', { 
        title: `Notes for ${book.title}`, 
        book, 
        notes,
        req, // Pass the request object to the template
    });
});

// Helper function to process and get tag IDs
const processTags = async (tagString) => {
    if (!tagString || tagString.trim() === '') {
        return [];
    }
    const tagNames = tagString.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
    if (tagNames.length === 0) {
        return [];
    }

    // Use ON CONFLICT to avoid race conditions and errors for existing tags
    const insertQuery = `
        INSERT INTO tags (tag_name)
        SELECT unnest($1::text[])
        ON CONFLICT (tag_name) DO NOTHING;
    `;
    await pool.query(insertQuery, [tagNames]);

    // Now fetch the IDs for all the tags
    const selectQuery = `SELECT id FROM tags WHERE tag_name = ANY($1::text[])`;
    const result = await pool.query(selectQuery, [tagNames]);
    return result.rows.map(row => row.id);
};

// Add a new note
const addNote = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const { content_markdown, tags, excerpt, page, chapter } = req.body;
    const userId = req.session.user.id;

    const rendered_html = sanitizeMarkdown(content_markdown);

    await pool.query('BEGIN');
    try {
        const noteResult = await pool.query(
            'INSERT INTO notes (user_id, book_id, content_markdown, rendered_html, excerpt, page, chapter) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [userId, bookId, content_markdown, rendered_html, excerpt, page, chapter]
        );
        const noteId = noteResult.rows[0].id;

        // Log this activity
        await pool.query(
            'INSERT INTO activity_log (user_id, action_type, book_id, note_id) VALUES ($1, $2, $3, $4)',
            [userId, 'created_note', bookId, noteId]
        );

        const tagIds = await processTags(tags);

        if (tagIds.length > 0) {
            const insertTagsQuery = `
                INSERT INTO notes_tags (note_id, tag_id)
                SELECT $1, unnest($2::int[]);
            `;
            await pool.query(insertTagsQuery, [noteId, tagIds]);
        }

        await pool.query('COMMIT');
        res.redirect(`/notes/${bookId}`);
    } catch (err) {
        await pool.query('ROLLBACK');
        throw err;
    }
});

// Show page to edit a note
const getEditNotePage = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    const userId = req.session.user.id;

    const query = `
        SELECT n.*, COALESCE(string_agg(t.tag_name, ', '), '') as tags
        FROM notes n
        LEFT JOIN notes_tags nt ON n.id = nt.note_id
        LEFT JOIN tags t ON nt.tag_id = t.id
        WHERE n.id = $1 AND n.user_id = $2
        GROUP BY n.id
    `;
    const result = await pool.query(query, [noteId, userId]);

    if (result.rows.length === 0) {
        res.status(403);
        throw new Error('Note not found or you do not have permission to edit it.');
    }
    const note = result.rows[0];

    const bookResult = await pool.query('SELECT * FROM books WHERE id = $1', [note.book_id]);
    if (bookResult.rows.length === 0) {
        res.status(404);
        throw new Error('Book not found.');
    }
    const book = bookResult.rows[0];

    res.render('edit-note', { title: 'Edit Note', note: note, book: book });
});

// Update a note
const updateNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    const { content_markdown, tags, excerpt, page, chapter } = req.body;
    const userId = req.session.user.id;

    const rendered_html = sanitizeMarkdown(content_markdown);

    await pool.query('BEGIN');
    try {
        const result = await pool.query(
            'UPDATE notes SET content_markdown = $1, rendered_html = $2, excerpt = $3, page = $4, chapter = $5 WHERE id = $6 AND user_id = $7 RETURNING book_id',
            [content_markdown, rendered_html, excerpt, page, chapter, noteId, userId]
        );

        if (result.rows.length === 0) {
            throw new Error('Update failed: Note not found or you do not have permission.');
        }
        
        // Clear existing tags for the note
        await pool.query('DELETE FROM notes_tags WHERE note_id = $1', [noteId]);

        // Process and add new tags
        const tagIds = await processTags(tags);
        if (tagIds.length > 0) {
            const insertTagsQuery = `
                INSERT INTO notes_tags (note_id, tag_id)
                SELECT $1, unnest($2::int[]);
            `;
            await pool.query(insertTagsQuery, [noteId, tagIds]);
        }

        await pool.query('COMMIT');
        const { book_id } = result.rows[0];
        res.redirect(`/notes/${book_id}`);
    } catch (err) {
        await pool.query('ROLLBACK');
        throw err;
    }
});

// Delete a note
const deleteNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    const userId = req.session.user.id;

    const result = await pool.query(
        'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING book_id',
        [noteId, userId]
    );

    if (result.rows.length === 0) {
        res.status(403);
        throw new Error('Delete failed: Note not found or you do not have permission.');
    }

    const { book_id } = result.rows[0];
    res.redirect(`/notes/${book_id}`);
});

module.exports = {
    getNotesForBook,
    addNote,
    getEditNotePage,
    updateNote,
    deleteNote,
};
