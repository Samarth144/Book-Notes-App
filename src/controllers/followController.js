const asyncHandler = require('express-async-handler');
const pool = require('../db/pool');

// List all users for following
const listUsers = asyncHandler(async (req, res) => {
    const currentUserId = req.session.user.id;

    // This query lists all users except the current one, and includes a boolean
    // to indicate if the current user is already following them.
    const query = `
        SELECT 
            u.id, 
            u.username,
            EXISTS (
                SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id
            ) as is_following
        FROM users u
        WHERE u.id != $1
        ORDER BY u.username
    `;
    const result = await pool.query(query, [currentUserId]);

    res.render('users', {
        title: 'Find Users',
        users: result.rows,
    });
});

// Follow or unfollow a user
const toggleFollow = asyncHandler(async (req, res) => {
    const { userIdToFollow } = req.params;
    const currentUserId = req.session.user.id;

    // Check if the follow relationship exists
    const followResult = await pool.query(
        'SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2',
        [currentUserId, userIdToFollow]
    );

    if (followResult.rows.length > 0) {
        // If it exists, unfollow
        await pool.query(
            'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
            [currentUserId, userIdToFollow]
        );
    } else {
        // If it does not exist, follow
        await pool.query(
            'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
            [currentUserId, userIdToFollow]
        );
    }

    res.redirect('/users');
});

module.exports = {
    listUsers,
    toggleFollow,
};
