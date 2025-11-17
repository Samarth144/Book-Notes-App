const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const pool = require('../db/pool');
const logger = require('../utils/logger');

const saltRounds = 10;

// Render registration page
const getRegister = (req, res) => {
    res.render('register', { title: 'Register', errors: [] });
};

// Handle new user registration
const postRegister = asyncHandler(async (req, res) => {
    const { email, username, password, confirmPassword } = req.body;
    const errors = [];

    if (password !== confirmPassword) {
        errors.push('Passwords do not match.');
    }
    if (password.length < 6) {
        errors.push('Password must be at least 6 characters long.');
    }
    if (!username || username.trim() === '') {
        errors.push('Username cannot be empty.');
    }
    if (errors.length > 0) {
        return res.render('register', { title: 'Register', errors });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const result = await pool.query(
            'INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, email, username',
            [email, username, hashedPassword]
        );
        const user = result.rows[0];
        req.session.user = { id: user.id, email: user.email, username: user.username, preferences: user.preferences };
        res.redirect('/books');
    } catch (err) {
        // This catch block is for a specific user-facing error (duplicate email/username),
        // not a server error, so we handle it directly.
        logger.warn(`Failed registration attempt for email ${email} or username ${username}: ${err.message}`);
        if (err.code === '23505' && err.constraint === 'users_email_key') {
            errors.push('An account with this email already exists.');
        } else if (err.code === '23505' && err.constraint === 'users_username_key') {
            errors.push('This username is already taken.');
        } else {
            errors.push('An error occurred during registration.');
        }
        res.render('register', { title: 'Register', errors });
    }
});

// Render login page
const getLogin = (req, res) => {
    res.render('login', { title: 'Login', errors: [] });
};

// Handle user login
const postLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (user) {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = { id: user.id, email: user.email, username: user.username, preferences: user.preferences };
            return res.redirect('/books');
        }
    }

    // If user not found or password doesn't match, render login with an error.
    // This is a control flow, not a server error.
    res.render('login', { title: 'Login', errors: ['Invalid email or password.'] });
});

// Handle user logout
const getLogout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            // If session destruction fails, log it and redirect anyway.
            logger.error('Failed to destroy session:', err);
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
};

module.exports = {
    getRegister,
    postRegister,
    getLogin,
    postLogin,
    getLogout,
};
