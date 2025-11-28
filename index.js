require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');

const pgPool = require('./src/db/pool');
const logger = require('./src/utils/logger');
const pinoHttp = require('pino-http');
const errorHandler = require('./src/middleware/errorHandler');

const authRoutes = require('./src/routes/authRoutes');
const searchRoutes = require('./src/routes/searchRoutes');
const bookRoutes = require('./src/routes/bookRoutes');
const noteRoutes = require('./src/routes/noteRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const shareRoutes = require('./src/routes/shareRoutes');
const followRoutes = require('./src/routes/followRoutes');
const feedRoutes = require('./src/routes/feedRoutes');
const reactionRoutes = require('./src/routes/reactionRoutes');

const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---

// Add pino-http request logger
app.use(pinoHttp({ logger }));

// Check for session secret
if (!process.env.SESSION_SECRET) {
    logger.error('FATAL ERROR: SESSION_SECRET is not defined in your .env file.');
    process.exit(1);
}

// Session configuration
app.use(session({
    store: new pgSession({
        pool: pgPool,
        tableName: 'sessions',
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

// Middleware to pass user data to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Routes ---
app.use(authRoutes);
app.use(searchRoutes);
app.use(bookRoutes);
app.use(noteRoutes);
app.use(profileRoutes);
app.use(shareRoutes);
app.use(followRoutes);
app.use(feedRoutes);
app.use(reactionRoutes);

app.get('/', (req, res) => {
    res.render('home', { title: 'Book Notes App', featuredBooks: [] });
});

// --- Error Handling ---
// This must be the last piece of middleware
app.use(errorHandler);

// --- Server Start ---
app.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}`);
});
