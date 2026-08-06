'use strict'

/** @param {import('knex').Knex} knex */
exports.up = async function (knex) {
  await knex.schema.createTable('campaigns', (table) => {
    table.text('id').primary()
    table.text('name').notNullable()
    table.text('game_variant').notNullable() // 'scratch-card' | 'flip-card'
    table.boolean('is_active').notNullable().defaultTo(false)
    table.decimal('win_probability', 4, 3).notNullable().defaultTo(0.5)
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('campaign_coupons', (table) => {
    table.increments('id').primary()
    table.text('campaign_id').notNullable().references('id').inTable('campaigns').onDelete('CASCADE')
    table.text('coupon_id').notNullable()
    table.text('title').notNullable()
    table.text('discount').notNullable()
    table.timestamp('start_date', { useTz: true }).notNullable()
    table.timestamp('end_date', { useTz: true }).notNullable()
    table.integer('weight').notNullable().defaultTo(1)
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())

    table.index(['campaign_id'], 'idx_campaign_coupons_campaign')
  })
}

/** @param {import('knex').Knex} knex */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('campaign_coupons')
  await knex.schema.dropTableIfExists('campaigns')
}
