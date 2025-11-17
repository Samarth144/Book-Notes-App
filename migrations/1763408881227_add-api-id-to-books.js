/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumn('books', {
        api_id: {
            type: 'varchar(255)',
            unique: true,
        }
    });
};

exports.down = pgm => {
    pgm.dropColumn('books', 'api_id');
};