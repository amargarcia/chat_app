// Obtain a Pool of DB connections.
const config = require("../config.js");

const { Pool } = require("pg");
const pool = new Pool(config.DB_OPTIONS);

module.exports = pool;
