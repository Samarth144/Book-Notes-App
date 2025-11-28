const asyncHandler = require('express-async-handler');
const pool = require('../db/pool');

// Get the user's activity feed
const getFeed = asyncHandler(async (req, res) => {
    const currentUserId = req.session.user.id;
    const { page = 1, ajax, search, type } = req.query;

    const itemsPerPage = 5;
    const offset = (page - 1) * itemsPerPage;

    // Build dynamic WHERE clauses
    const queryParams = [currentUserId, itemsPerPage, offset];
    let paramIndex = 4;
    let filterClauses = '';

    if (search) {
        filterClauses += ` AND (u.username ILIKE $${paramIndex} OR b.title ILIKE $${paramIndex} OR b.author ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
        paramIndex++;
    }

    if (type && type !== 'all') {
        filterClauses += ` AND al.action_type = $${paramIndex}`;
        queryParams.push(type);
        paramIndex++;
    }

    // This query fetches the activities of users that the current user follows.
    // It joins all necessary tables to get the context for each activity.
    const feedQuery = `
        SELECT 
            al.id as activity_id,
            al.action_type,
            al.created_at,
            u.username,
            b.id as book_id,
            b.title as book_title,
            n.id as note_id,
            n.share_slug,
            COALESCE(
                (
                    SELECT json_agg(json_build_object('type', sub.type, 'count', sub.count))
                    FROM (
                        SELECT type, count(*) as count 
                        FROM reactions 
                        WHERE activity_id = al.id 
                        GROUP BY type
                    ) sub
                ),
                '[]'
            ) as reactions,
            COALESCE(
                (
                    SELECT json_agg(type) 
                    FROM reactions 
                    WHERE activity_id = al.id AND user_id = $1
                ),
                '[]'
            ) as my_reactions
        FROM activity_log al
        JOIN users u ON al.user_id = u.id
        JOIN follows f ON al.user_id = f.following_id
        LEFT JOIN books b ON al.book_id = b.id
        LEFT JOIN notes n ON al.note_id = n.id
        WHERE f.follower_id = $1 ${filterClauses}
        ORDER BY al.created_at DESC
        LIMIT $2 OFFSET $3
    `;
    
    const feedResult = await pool.query(feedQuery, queryParams);

    if (ajax === 'true') {
        return res.render('partials/feed-list', {
            feedItems: feedResult.rows
        });
    }

    // Fetch Weekly Top Notes/Activities
    // We look for 'created_note' or 'shared_note' activities from the last 7 days
    // and count their reactions.
    const weeklyTopQuery = `
        SELECT 
            al.id as activity_id,
            al.action_type,
            al.created_at,
            b.title as book_title,
            b.cover_image_url,
            u.username,
            n.id as note_id,
            n.share_slug,
            COUNT(r.id) as reaction_count
        FROM activity_log al
        JOIN books b ON al.book_id = b.id
        JOIN users u ON al.user_id = u.id
        LEFT JOIN notes n ON al.note_id = n.id
        LEFT JOIN reactions r ON al.id = r.activity_id
        WHERE al.created_at > NOW() - INTERVAL '7 days'
          AND al.action_type IN ('created_note', 'shared_note')
        GROUP BY al.id, b.id, u.id, n.id
        ORDER BY reaction_count DESC, al.created_at DESC
        LIMIT 5
    `;
    
    const weeklyTopResult = await pool.query(weeklyTopQuery);

    // A similar query for total count would be needed for pagination,
    // but we'll omit it for this initial implementation to keep it simple.
    
    res.render('feed', {
        title: 'My Feed',
        feedItems: feedResult.rows,
        weeklyTop: weeklyTopResult.rows,
    });
});

module.exports = {
    getFeed,
};
