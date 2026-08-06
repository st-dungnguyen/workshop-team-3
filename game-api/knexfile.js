'use strict'

require('dotenv').config()

/** @type {import('knex').Knex.Config} */
module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: './migrations',
    extension: 'js',
  },
  seeds: {
    directory: './seeds',
  },
  pool: {
    min: 2,
    max: 10,
  },
}
