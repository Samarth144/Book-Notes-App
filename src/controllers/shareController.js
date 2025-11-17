const asyncHandler = require('express-async-handler');
const { nanoid } = require('nanoid');
const pool = require('../db/pool');

// Get a public, read-only version of a note
const getPublicNote = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const query = `
        SELECT 
            n.rendered_html, n.excerpt, n.page, n.chapter, n.created_at,
            b.title as book_title, b.author as book_author, b.cover_image_url,
            u.username
        FROM notes n
        JOIN books b ON n.book_id = b.id
        JOIN users u ON n.user_id = u.id
        WHERE n.share_slug = $1 AND n.is_public = TRUE
    `;
    const result = await pool.query(query, [slug]);

    if (result.rows.length === 0) {
        res.status(404);
        throw new Error('Shared note not found or is no longer public.');
    }

    const note = result.rows[0];
    res.render('public-note', {
        title: `A note on ${note.book_title}`,
        note,
    });
});

// Toggle the public share status of a note
const toggleShare = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    const userId = req.session.user.id;

    // First, get the current status and slug
    const currentNote = await pool.query(
        'SELECT is_public, share_slug, book_id FROM notes WHERE id = $1 AND user_id = $2',
        [noteId, userId]
    );

    if (currentNote.rows.length === 0) {
        res.status(403);
        throw new Error('Note not found or you do not have permission to modify it.');
    }

    const { is_public, share_slug, book_id } = currentNote.rows[0];
    const newPublicStatus = !is_public;
    let newSlug = share_slug;

    // If making public for the first time, generate a slug
    if (newPublicStatus && !share_slug) {
        newSlug = nanoid();
    }

    // Update the note
    await pool.query(
        'UPDATE notes SET is_public = $1, share_slug = $2 WHERE id = $3',
        [newPublicStatus, newSlug, noteId]
    );

    // Log the activity if the note was made public
    if (newPublicStatus) {
        await pool.query(
            'INSERT INTO activity_log (user_id, action_type, book_id, note_id) VALUES ($1, $2, $3, $4)',
            [userId, 'shared_note', book_id, noteId]
        );
    }

    res.redirect(`/notes/${book_id}`);
});


module.exports = {
    getPublicNote,
    toggleShare,
};
