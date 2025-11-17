/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumn('users', {
        preferences: {
            type: 'jsonb',
            notNull: true,
            default: '{}',
        }
    });
};

exports.down = pgm => {
    pgm.dropColumn('users', 'preferences');
};