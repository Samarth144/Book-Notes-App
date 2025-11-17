/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // 1. Users table
    pgm.createTable('users', {
        id: 'id',
        email: { type: 'varchar(255)', notNull: true, unique: true },
        password: { type: 'varchar(255)', notNull: true },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    // 2. Books table
    pgm.createTable('books', {
        id: 'id',
        title: { type: 'varchar(255)', notNull: true },
        author: { type: 'varchar(255)' },
        cover_image_url: { type: 'varchar(255)' },
        isbn: { type: 'varchar(20)', unique: true }, // Added for uniqueness
    });

    // 3. Users_Books join table
    pgm.createTable('users_books', {
        user_id: {
            type: 'integer',
            notNull: true,
            references: '"users"',
            onDelete: 'cascade',
        },
        book_id: {
            type: 'integer',
            notNull: true,
            references: '"books"',
            onDelete: 'cascade',
        },
    });
    // Add a composite primary key
    pgm.addConstraint('users_books', 'users_books_pkey', {
        primaryKey: ['user_id', 'book_id'],
    });

    // 4. Notes table
    pgm.createTable('notes', {
        id: 'id',
        note_content: { type: 'text', notNull: true },
        user_id: {
            type: 'integer',
            notNull: true,
        },
        book_id: {
            type: 'integer',
            notNull: true,
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
    // Add a foreign key constraint to the join table
    pgm.addConstraint('notes', 'notes_users_books_fk', {
        foreignKeys: {
            columns: ['user_id', 'book_id'],
            references: 'users_books(user_id, book_id)',
            onDelete: 'cascade',
        },
    });

    // 5. Sessions table
    pgm.createTable('sessions', {
        sid: { type: 'varchar', primaryKey: true },
        sess: { type: 'json', notNull: true },
        expire: { type: 'timestamp(6)', notNull: true },
    });
};

exports.down = pgm => {
    pgm.dropTable('sessions');
    pgm.dropTable('notes');
    pgm.dropTable('users_books');
    pgm.dropTable('books');
    pgm.dropTable('users');
};