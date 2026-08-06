'use strict'

/** @param {import('knex').Knex} knex */
exports.up = async function (knex) {
  await knex.schema.alterTable('game_sessions', (table) => {
    table.integer('points_awarded').nullable()
  })
}

/** @param {import('knex').Knex} knex */
exports.down = async function (knex) {
  await knex.schema.alterTable('game_sessions', (table) => {
    table.dropColumn('points_awarded')
  })
}
