/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // 1. Create the tags table
    pgm.createTable('tags', {
        id: 'id',
        tag_name: { type: 'varchar(50)', notNull: true, unique: true },
    });

    // 2. Create the notes_tags join table
    pgm.createTable('notes_tags', {
        note_id: {
            type: 'integer',
            notNull: true,
            references: '"notes"',
            onDelete: 'cascade',
        },
        tag_id: {
            type: 'integer',
            notNull: true,
            references: '"tags"',
            onDelete: 'cascade',
        },
    });

    // Add a composite primary key to the join table
    pgm.addConstraint('notes_tags', 'notes_tags_pkey', {
        primaryKey: ['note_id', 'tag_id'],
    });
};

exports.down = pgm => {
    pgm.dropTable('notes_tags');
    pgm.dropTable('tags');
};