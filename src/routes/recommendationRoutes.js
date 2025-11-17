const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { isLoggedIn } = require('../middleware/authMiddleware');

// Display recommendations for the logged-in user
router.get('/recommendations', isLoggedIn, recommendationController.getRecommendationsPage);

module.exports = router;
