const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const pool = require('../db/pool');
const logger = require('../utils/logger');
const { nanoid } = require('nanoid');

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
        const verificationToken = nanoid();
        const result = await pool.query(
            'INSERT INTO users (email, username, password, verification_token) VALUES ($1, $2, $3, $4) RETURNING id, email, username',
            [email, username, hashedPassword, verificationToken]
        );
        const user = result.rows[0];

        // TODO: Send verification email
        logger.info(`Verification token for ${email}: ${verificationToken}`);

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

// Handle email verification
const getVerifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;
    const result = await pool.query('SELECT * FROM users WHERE verification_token = $1', [token]);
    const user = result.rows[0];

    if (user) {
        await pool.query('UPDATE users SET email_verified = true, verification_token = null WHERE id = $1', [user.id]);
        // You might want to automatically log the user in here
        res.send('Email verified successfully!');
    } else {
        res.send('Invalid verification token.');
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

// Render forgot password page
const getForgotPassword = (req, res) => {
    res.render('forgot-password', { title: 'Forgot Password', errors: [] });
};

// Handle forgot password form submission
const postForgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (user) {
        const resetToken = nanoid();
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

        await pool.query('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3', [resetToken, resetTokenExpires, user.id]);

        // TODO: Send password reset email
        logger.info(`Password reset token for ${email}: ${resetToken}`);
    }

    // Always show a success message to prevent user enumeration
    res.send('If an account with that email exists, a password reset link has been sent.');
});

// Render reset password page
const getResetPassword = asyncHandler(async (req, res) => {
    const { token } = req.query;
    const result = await pool.query('SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()', [token]);
    const user = result.rows[0];

    if (user) {
        res.render('reset-password', { title: 'Reset Password', token, errors: [] });
    } else {
        res.send('Invalid or expired password reset token.');
    }
});

// Handle reset password form submission
const postResetPassword = asyncHandler(async (req, res) => {
    const { token } = req.query;
    const { password, confirmPassword } = req.body;
    const errors = [];

    if (password !== confirmPassword) {
        errors.push('Passwords do not match.');
    }
    if (password.length < 6) {
        errors.push('Password must be at least 6 characters long.');
    }
    if (errors.length > 0) {
        return res.render('reset-password', { title: 'Reset Password', token, errors });
    }

    const result = await pool.query('SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()', [token]);
    const user = result.rows[0];

    if (user) {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await pool.query('UPDATE users SET password = $1, reset_token = null, reset_token_expires = null WHERE id = $2', [hashedPassword, user.id]);
        res.send('Password has been reset successfully.');
    } else {
        res.send('Invalid or expired password reset token.');
    }
});

module.exports = {
    getRegister,
    postRegister,
    getVerifyEmail,
    getLogin,
    postLogin,
    getLogout,
    getForgotPassword,
    postForgotPassword,
    getResetPassword,
    postResetPassword,
};
