/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
    pgm.addColumns('users', {
        email_verified: {
            type: 'boolean',
            default: false,
            notNull: true,
        },
        verification_token: {
            type: 'text',
        },
        reset_token: {
            type: 'text',
        },
        reset_token_expires: {
            type: 'timestamp',
        },
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropColumns('users', ['email_verified', 'verification_token', 'reset_token', 'reset_token_expires']);
};
