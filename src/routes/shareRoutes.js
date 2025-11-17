const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const { isLoggedIn } = require('../middleware/authMiddleware');

// Public, read-only route for a shared note
router.get('/share/:slug', shareController.getPublicNote);

// Private route to toggle the share status of a note
router.post('/notes/share/:noteId', isLoggedIn, shareController.toggleShare);

module.exports = router;
