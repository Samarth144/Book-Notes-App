exports.shorthands = undefined;

exports.up = pgm => {
    pgm.createTable('reactions', {
        id: 'id',
        user_id: {
            type: 'integer',
            notNull: true,
            references: '"users"',
            onDelete: 'cascade',
        },
        activity_id: {
            type: 'integer',
            notNull: true,
            references: '"activity_log"',
            onDelete: 'cascade',
        },
        type: {
            type: 'varchar(20)',
            notNull: true,
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    pgm.addConstraint('reactions', 'reactions_user_activity_type_unique', {
        unique: ['user_id', 'activity_id', 'type'],
    });

    pgm.createIndex('reactions', 'activity_id');
};

exports.down = pgm => {
    pgm.dropTable('reactions');
};
