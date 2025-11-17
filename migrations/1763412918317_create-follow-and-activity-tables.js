/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // 1. Create the follows table
    pgm.createTable('follows', {
        follower_id: {
            type: 'integer',
            notNull: true,
            references: '"users"',
            onDelete: 'cascade',
        },
        following_id: {
            type: 'integer',
            notNull: true,
            references: '"users"',
            onDelete: 'cascade',
        },
    });
    pgm.addConstraint('follows', 'follows_pkey', {
        primaryKey: ['follower_id', 'following_id'],
    });

    // 2. Create the activity_log table
    pgm.createTable('activity_log', {
        id: 'id',
        user_id: {
            type: 'integer',
            notNull: true,
            references: '"users"',
            onDelete: 'cascade',
        },
        action_type: { type: 'varchar(50)', notNull: true }, // e.g., 'added_book', 'created_note'
        book_id: {
            type: 'integer',
            references: '"books"',
            onDelete: 'cascade', // If a book is deleted, the log entry is less useful
        },
        note_id: {
            type: 'integer',
            references: '"notes"',
            onDelete: 'cascade', // If a note is deleted, delete the log entry
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    // Add indexes for faster querying of the feed
    pgm.createIndex('activity_log', 'user_id');
};

exports.down = pgm => {
    pgm.dropTable('activity_log');
    pgm.dropTable('follows');
};