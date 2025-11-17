const asyncHandler = require('express-async-handler');
const pool = require('../db/pool');

// Get the user's activity feed
const getFeed = asyncHandler(async (req, res) => {
    const currentUserId = req.session.user.id;
    const { page = 1 } = req.query;

    const itemsPerPage = 20;
    const offset = (page - 1) * itemsPerPage;

    // This query fetches the activities of users that the current user follows.
    // It joins all necessary tables to get the context for each activity.
    const feedQuery = `
        SELECT 
            al.action_type,
            al.created_at,
            u.username,
            b.id as book_id,
            b.title as book_title,
            n.id as note_id,
            n.share_slug
        FROM activity_log al
        JOIN users u ON al.user_id = u.id
        JOIN follows f ON al.user_id = f.following_id
        LEFT JOIN books b ON al.book_id = b.id
        LEFT JOIN notes n ON al.note_id = n.id
        WHERE f.follower_id = $1
        ORDER BY al.created_at DESC
        LIMIT $2 OFFSET $3
    `;
    
    const feedResult = await pool.query(feedQuery, [currentUserId, itemsPerPage, offset]);

    // A similar query for total count would be needed for pagination,
    // but we'll omit it for this initial implementation to keep it simple.
    
    res.render('feed', {
        title: 'My Feed',
        feedItems: feedResult.rows,
    });
});

module.exports = {
    getFeed,
};
