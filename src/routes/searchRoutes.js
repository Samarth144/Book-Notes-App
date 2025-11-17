const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { isLoggedIn } = require('../middleware/authMiddleware'); // We will create this middleware next

// Search route
router.get('/search', isLoggedIn, searchController.getSearchPage);

module.exports = router;
