const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { isLoggedIn } = require('../middleware/authMiddleware');

// Display notes for a book
router.get('/notes/:bookId', isLoggedIn, noteController.getNotesForBook);

// Add a new note to a book
router.post('/notes/:bookId', isLoggedIn, noteController.addNote);

// Display the edit page for a specific note
router.get('/notes/edit/:noteId', isLoggedIn, noteController.getEditNotePage);

// Update a specific note
router.post('/notes/edit/:noteId', isLoggedIn, noteController.updateNote);

// Delete a specific note
router.post('/notes/delete/:noteId', isLoggedIn, noteController.deleteNote);

module.exports = router;
