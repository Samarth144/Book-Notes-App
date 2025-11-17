const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { isLoggedIn } = require('../middleware/authMiddleware');

// Routes for user profile
router.get('/profile', isLoggedIn, profileController.getProfilePage);
router.post('/profile', isLoggedIn, profileController.updateProfile);

module.exports = router;
