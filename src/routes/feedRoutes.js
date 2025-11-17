const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');
const { isLoggedIn } = require('../middleware/authMiddleware');

// Display the user's activity feed
router.get('/feed', isLoggedIn, feedController.getFeed);

module.exports = router;
