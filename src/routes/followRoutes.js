const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { isLoggedIn } = require('../middleware/authMiddleware');

// Display a list of all users
router.get('/users', isLoggedIn, followController.listUsers);

// Follow/unfollow a user
router.post('/users/follow/:userIdToFollow', isLoggedIn, followController.toggleFollow);

module.exports = router;
