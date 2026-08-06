'use strict'

/** @param {import('knex').Knex} knex */
exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('game_sessions')
  if (!exists) {
    await knex.schema.createTable('game_sessions', (table) => {
      table.increments('id').primary()
      table.text('user_id').notNullable()
      table.date('play_date').notNullable()
      table.string('outcome', 8).notNullable()
      table.text('coupon_id').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    })
  }

  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_game_sessions_user_date ON game_sessions (user_id, play_date)'
  )
}

/** @param {import('knex').Knex} knex */
exports.down = async function (knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_game_sessions_user_date')
  await knex.schema.dropTableIfExists('game_sessions')
}
