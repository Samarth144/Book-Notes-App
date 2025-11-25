const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration routes
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

// Email verification route
router.get('/verify-email', authController.getVerifyEmail);

// Login routes
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// Logout route
router.get('/logout', authController.getLogout);

// Forgot password routes
router.get('/forgot-password', authController.getForgotPassword);
router.post('/forgot-password', authController.postForgotPassword);

// Reset password routes
router.get('/reset-password', authController.getResetPassword);
router.post('/reset-password', authController.postResetPassword);

module.exports = router;
