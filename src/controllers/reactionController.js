const asyncHandler = require('express-async-handler');
const pool = require('../db/pool');

const toggleReaction = asyncHandler(async (req, res) => {
    const { activityId } = req.params;
    const { type } = req.body;
    
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.session.user.id;

    // Map UI emojis/names to database values if needed, 
    // or just validate against allowed types.
    // Allowed: 'heart', 'like', 'fire', 'mind_blown'
    // Corresponding emojis: ❤️, 👍, 🔥, 🤯
    const allowedTypes = ['heart', 'like', 'fire', 'mind_blown'];
    
    if (!allowedTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid reaction type' });
    }

    // Check if reaction exists
    const checkQuery = `
        SELECT id FROM reactions 
        WHERE user_id = $1 AND activity_id = $2 AND type = $3
    `;
    const checkResult = await pool.query(checkQuery, [userId, activityId, type]);

    let action = '';
    
    if (checkResult.rows.length > 0) {
        // Remove reaction
        await pool.query(
            'DELETE FROM reactions WHERE id = $1',
            [checkResult.rows[0].id]
        );
        action = 'removed';
    } else {
        // Add reaction
        await pool.query(
            'INSERT INTO reactions (user_id, activity_id, type) VALUES ($1, $2, $3)',
            [userId, activityId, type]
        );
        action = 'added';
    }
    
    // Return the new count for this type on this activity
    const countQuery = `
        SELECT count(*) as count FROM reactions WHERE activity_id = $1 AND type = $2
    `;
    const countResult = await pool.query(countQuery, [activityId, type]);
    
    res.json({ 
        status: 'success', 
        action, 
        type, 
        count: parseInt(countResult.rows[0].count) 
    });
});

module.exports = { toggleReaction };
