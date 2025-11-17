/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumns('notes', {
        excerpt: { type: 'text' },
        page: { type: 'varchar(50)' },
        chapter: { type: 'varchar(100)' },
    });
};

exports.down = pgm => {
    pgm.dropColumns('notes', ['excerpt', 'page', 'chapter']);
};