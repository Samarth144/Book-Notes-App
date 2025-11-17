/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.dropColumn('books', 'isbn');
};

exports.down = pgm => {
    pgm.addColumn('books', {
        isbn: {
            type: 'varchar(20)',
            unique: true,
        }
    });
};