const express = require('express');
const router = express.Router();
const reactionController = require('../controllers/reactionController');
const { isLoggedIn } = require('../middleware/authMiddleware');

router.post('/reactions/:activityId/toggle', isLoggedIn, reactionController.toggleReaction);

module.exports = router;
