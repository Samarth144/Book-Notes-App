const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { isLoggedIn } = require('../middleware/authMiddleware');

// Route to display user's library
router.get('/books', isLoggedIn, bookController.getLibrary);

// Route to add a book to the user's library
router.post('/books/add', isLoggedIn, bookController.addBook);

module.exports = router;
