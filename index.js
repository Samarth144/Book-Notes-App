require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pg = require('pg');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Database connection setup
const pgPool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Add a listener for pool errors
pgPool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Session configuration
app.use(session({
    store: new pgSession({
        pool: pgPool,                // Connection pool
        tableName: 'sessions',       // Use the sessions table we created
    }),
    secret: process.env.SESSION_SECRET || 'supersecretkey', // Fallback for development, use strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
    res.render('home', { title: 'Book Notes App' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
