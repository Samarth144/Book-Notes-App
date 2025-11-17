const NodeCache = require('node-cache');

// Create a new cache instance
// stdTTL: The standard time-to-live in seconds for every new entry. 0 = unlimited.
// checkperiod: The period in seconds to check for expired entries.
const cache = new NodeCache({ stdTTL: 60 * 60, checkperiod: 60 * 15 });

module.exports = cache;
