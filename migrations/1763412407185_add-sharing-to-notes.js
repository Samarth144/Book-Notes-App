/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumns('notes', {
        is_public: {
            type: 'boolean',
            notNull: true,
            default: false,
        },
        share_slug: {
            type: 'varchar(21)', // nanoid default length is 21
            unique: true,
        }
    });
};

exports.down = pgm => {
    pgm.dropColumns('notes', ['is_public', 'share_slug']);
};