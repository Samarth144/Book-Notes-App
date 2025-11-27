const asyncHandler = require('express-async-handler');
const pool = require('../db/pool');

// Render the profile page
const getProfilePage = asyncHandler(async (req, res) => {
    // The user object with preferences should already be in the session
    res.render('profile', {
        title: 'My Profile',
    });
});

// Update user preferences
const updateProfile = asyncHandler(async (req, res) => {
    const { theme, defaultSort, card_theme } = req.body;
    const userId = req.session.user.id;

    const newPreferences = {
        theme: theme || 'light',
        defaultSort: defaultSort || 'title_asc',
        card_theme: card_theme || '',
    };

    // Update preferences in the database
    await pool.query(
        'UPDATE users SET preferences = $1 WHERE id = $2',
        [newPreferences, userId]
    );

    // Update the session object
    req.session.user.preferences = newPreferences;

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({ success: true, message: 'Preferences updated' });
    }

    res.redirect('/profile');
});

module.exports = {
    getProfilePage,
    updateProfile,
};
