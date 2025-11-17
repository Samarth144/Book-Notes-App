/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // Rename the existing column
    pgm.renameColumn('notes', 'note_content', 'content_markdown');

    // Add the new column for storing rendered HTML
    pgm.addColumn('notes', {
        rendered_html: {
            type: 'text',
            notNull: true,
            // We'll need to backfill this for existing notes, but for now, a default is needed.
            // Since we can't easily render markdown here, we'll default to an empty string.
            default: '', 
        }
    });
};

exports.down = pgm => {
    pgm.dropColumn('notes', 'rendered_html');
    pgm.renameColumn('notes', 'content_markdown', 'note_content');
};