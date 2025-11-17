/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // Add search_vector column to books table
    pgm.addColumn('books', {
        search_vector: {
            type: 'tsvector',
        },
    });

    // Create GIN index on books.search_vector
    pgm.createIndex('books', 'search_vector', {
        using: 'gin',
    });

    // Create function to update books.search_vector
    pgm.createFunction(
        'books_search_vector_update_trigger',
        [],
        {
            returns: 'trigger',
            language: 'plpgsql',
        },
        `
        BEGIN
            NEW.search_vector = to_tsvector('english', NEW.title || ' ' || NEW.author);
            RETURN NEW;
        END;
        `
    );

    // Create trigger to update books.search_vector on insert/update
    pgm.sql(`
        CREATE TRIGGER books_search_vector_update
        BEFORE INSERT OR UPDATE ON books
        FOR EACH ROW EXECUTE FUNCTION books_search_vector_update_trigger();
    `);

    // Initial population for existing books
    pgm.sql(`UPDATE books SET search_vector = to_tsvector('english', title || ' ' || author);`);


    // Add search_vector column to notes table
    pgm.addColumn('notes', {
        search_vector: {
            type: 'tsvector',
        },
    });

    // Create GIN index on notes.search_vector
    pgm.createIndex('notes', 'search_vector', {
        using: 'gin',
    });

    // Create function to update notes.search_vector
    pgm.createFunction(
        'notes_search_vector_update_trigger',
        [],
        {
            returns: 'trigger',
            language: 'plpgsql',
        },
        `
        BEGIN
            NEW.search_vector = to_tsvector('english', NEW.content_markdown || ' ' || COALESCE(NEW.excerpt, ''));
            RETURN NEW;
        END;
        `
    );

    // Create trigger to update notes.search_vector on insert/update
    pgm.sql(`
        CREATE TRIGGER notes_search_vector_update
        BEFORE INSERT OR UPDATE ON notes
        FOR EACH ROW EXECUTE FUNCTION notes_search_vector_update_trigger();
    `);

    // Initial population for existing notes
    pgm.sql(`UPDATE notes SET search_vector = to_tsvector('english', content_markdown || ' ' || COALESCE(excerpt, ''));`);
};

exports.down = pgm => {
    // Drop triggers
    pgm.dropTrigger('notes', 'notes_search_vector_update');
    pgm.dropTrigger('books', 'books_search_vector_update');

    // Drop functions
    pgm.dropFunction('notes_search_vector_update_trigger', []);
    pgm.dropFunction('books_search_vector_update_trigger', []);

    // Drop indexes
    pgm.dropIndex('notes', 'search_vector');
    pgm.dropIndex('books', 'search_vector');

    // Drop columns
    pgm.dropColumn('notes', 'search_vector');
    pgm.dropColumn('books', 'search_vector');
};