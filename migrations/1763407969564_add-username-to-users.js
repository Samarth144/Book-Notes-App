/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumn('users', {
        username: {
            type: 'varchar(50)',
            notNull: true,
            unique: true,
        }
    });
};

exports.down = pgm => {
    pgm.dropColumn('users', 'username');
};