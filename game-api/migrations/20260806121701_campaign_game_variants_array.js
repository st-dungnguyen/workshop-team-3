'use strict'

/** @param {import('knex').Knex} knex */
exports.up = async function (knex) {
  // 1. Add new array column
  await knex.schema.alterTable('campaigns', (table) => {
    table.specificType('game_variants', 'TEXT[]')
  })

  // 2. Migrate existing data: copy single value into array
  await knex.raw(`
    UPDATE campaigns
    SET game_variants = ARRAY[game_variant]
    WHERE game_variant IS NOT NULL
  `)

  // 3. Make array column not nullable, drop old column
  await knex.raw('ALTER TABLE campaigns ALTER COLUMN game_variants SET NOT NULL')
  await knex.schema.alterTable('campaigns', (table) => {
    table.dropColumn('game_variant')
  })
}

/** @param {import('knex').Knex} knex */
exports.down = async function (knex) {
  // 1. Re-add single text column
  await knex.schema.alterTable('campaigns', (table) => {
    table.text('game_variant')
  })

  // 2. Copy first element back
  await knex.raw('UPDATE campaigns SET game_variant = game_variants[1]')

  // 3. Make not nullable, drop array column
  await knex.raw('ALTER TABLE campaigns ALTER COLUMN game_variant SET NOT NULL')
  await knex.schema.alterTable('campaigns', (table) => {
    table.dropColumn('game_variants')
  })
}
