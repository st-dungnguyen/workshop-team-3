'use strict'

/** @param {import('knex').Knex} knex */
exports.seed = async function (knex) {
  const campaignId = process.env.VITE_CAMPAIGN_ID || 'default-campaign'

  const existing = await knex('campaigns').where({ id: campaignId }).first()
  if (!existing) {
    const variants = (process.env.GAME_VARIANTS || 'scratch-card,flip-card')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)

    await knex('campaigns').insert({
      id: campaignId,
      name: process.env.COUPON_TITLE || 'すかいらーくグループ全店共通クーポン',
      game_variants: `{${variants.join(',')}}`,
      is_active: true,
      win_probability: Number(process.env.WIN_PROBABILITY) || 0.5,
    })
  }

  await knex('campaign_coupons').where({ campaign_id: campaignId }).delete()

  const fallbackStart = process.env.COUPON_START_DATE || new Date().toISOString()
  const fallbackEnd = process.env.COUPON_END_DATE || (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString()
  })()

  function fmtDiscount(raw) {
    if (!raw) return '-'
    if (/^\d+$/.test(raw)) return `${raw}円`
    if (/^[\d,]+〜[\d,]+$/.test(raw)) return `${raw}円`
    return raw
  }

  function fmtDate(raw, fallback) {
    return raw ? raw.replace(' ', 'T') + '+09:00' : fallback
  }

  const coupons = [
    { coupon_id: '35691', title: '井川テストクーポン', discount: '100', start_date: '2026-08-01 12:00:00', end_date: '2026-08-31 12:00:59' },
    { coupon_id: '35679', title: 'FDL coupon 287', discount: '10', start_date: '', end_date: '' },
    { coupon_id: '35678', title: 'Testing coupon 28701', discount: '120', start_date: '2026-07-27 12:00:00', end_date: '2026-08-07 12:00:59' },
    { coupon_id: '35654', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '729', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35653', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '729', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35652', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '674', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35651', title: '【店舗限定おトクーポン】\nコーンのオーブン焼き', discount: '272', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35650', title: '【店舗限定おトクーポン】\nコーンのオーブン焼き', discount: '228', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35649', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '709', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35648', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '599', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35647', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '544', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35646', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '489', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35645', title: '【店舗限定おトクーポン】\nあんこソフト', discount: '269', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35644', title: '【店舗限定おトクーポン】\nねぎとろ丼味噌汁・漬物付き', discount: '844', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35643', title: '【店舗限定おトクーポン】\nねぎとろ丼味噌汁・漬物付き', discount: '789', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35642', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '739', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35641', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '739', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35640', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '684', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35639', title: '【店舗限定おトクーポン】\nコーンのオーブン焼き', discount: '272', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35638', title: '【店舗限定おトクーポン】\nコーンのオーブン焼き', discount: '228', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35637', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '729', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35636', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '619', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35635', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '564', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35634', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '509', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35633', title: '【店舗限定おトクーポン】\nあんこソフト', discount: '269', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35632', title: '【店舗限定おトクーポン】\nねぎとろ丼味噌汁・漬物付き', discount: '864', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35631', title: '【店舗限定おトクーポン】\nねぎとろ丼味噌汁・漬物付き', discount: '809', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35630', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '749', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35629', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '749', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35628', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '694', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35627', title: '【店舗限定おトクーポン】\nコーンのオーブン焼き', discount: '272', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35626', title: '【店舗限定おトクーポン】\nコーンのオーブン焼き', discount: '228', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35625', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '739', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35624', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '629', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35623', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '574', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35622', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '519', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35621', title: '【店舗限定おトクーポン】\nあんこソフト', discount: '279', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35620', title: '【店舗限定おトクーポン】\nねぎとろ丼味噌汁・漬物付き', discount: '884', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35619', title: '【店舗限定おトクーポン】\nねぎとろ丼味噌汁・漬物付き', discount: '829', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35618', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '769', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35617', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '769', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35611', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '594', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35612', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '649', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35613', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '759', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35614', title: '【店舗限定おトクーポン】\nコーンのオーブン焼き', discount: '238', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35615', title: '【店舗限定おトクーポン】\nコーンのオーブン焼き', discount: '282', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35616', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '714', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35610', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '539', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35609', title: '【店舗限定おトクーポン】\nあんこソフト', discount: '279', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35608', title: '【店舗限定おトクーポン】\nねぎとろ丼味噌汁・漬物付き', discount: '904', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35607', title: '【店舗限定おトクーポン】\nねぎとろ丼味噌汁・漬物付き', discount: '849', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35606', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '779', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35605', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '779', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35604', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '724', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35603', title: '【店舗限定おトクーポン】\nコーンのオーブン焼き', discount: '292', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35602', title: '【店舗限定おトクーポン】\nコーンのオーブン焼き', discount: '248', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35601', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '769', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35600', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '659', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35599', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '604', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35598', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '549', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35597', title: '【店舗限定おトクーポン】\nあんこソフト', discount: '289', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35596', title: '【店舗限定おトクーポン】\nねぎとろ丼味噌汁・漬物付き', discount: '924', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35595', title: '【店舗限定おトクーポン】\nねぎとろ丼味噌汁・漬物付き', discount: '869', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35594', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '799', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35593', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '799', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35592', title: '【店舗限定おトクーポン】\n鉄板目玉ハンバーグ', discount: '744', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35591', title: '【店舗限定おトクーポン】\nコーンのオーブン焼き', discount: '292', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35590', title: '【店舗限定おトクーポン】\nコーンのオーブン焼き', discount: '248', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35589', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '789', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35588', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '679', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35587', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '624', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35586', title: '【店舗限定おトクーポン】\n目玉焼き＆ベーコンソーセージセット', discount: '569', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35585', title: '【店舗限定おトクーポン】\nあんこソフト', discount: '289', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35584', title: '【店舗限定おトクーポン】\nねぎとろ丼味噌汁・漬物付き', discount: '944', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35583', title: '【店舗限定おトクーポン】\nねぎとろ丼味噌汁・漬物付き', discount: '889', start_date: '2026-06-18 00:00:00', end_date: '2049-12-31 23:59:59' },
    { coupon_id: '35555', title: 'testfirsttime001', discount: '495〜545', start_date: '2025-05-29 00:00:00', end_date: '2032-06-01 23:59:59' },
    { coupon_id: '35547', title: 'test', discount: '', start_date: '2025-12-01 12:00:00', end_date: '2026-12-01 12:00:59' },
    { coupon_id: '35231', title: 'SEGMENTテスト：から好しももから揚げ ３コ）', discount: '295〜394', start_date: '2026-01-31 00:00:00', end_date: '2039-12-08 23:59:59' },
    { coupon_id: '35230', title: 'SEGMENTテスト：アサヒアルコールフリードライ', discount: '399〜443', start_date: '2026-01-31 00:00:00', end_date: '2039-12-08 23:59:59' },
    { coupon_id: '35229', title: 'SEGMENTテスト：セットドリンクバー', discount: '240〜319', start_date: '2026-01-31 00:00:00', end_date: '2039-12-08 23:59:59' },
    { coupon_id: '35228', title: 'インポートテスト：アサヒアルコールフリードライ', discount: '399〜443', start_date: '2026-01-31 00:00:00', end_date: '2039-12-08 23:59:59' },
    { coupon_id: '35227', title: 'インポートテスト：セットドリンクバー', discount: '240〜319', start_date: '2026-01-31 00:00:00', end_date: '2039-12-08 23:59:59' },
    { coupon_id: '35226', title: 'インポートテスト：から好しももから揚げ ３コ）', discount: '295〜394', start_date: '2026-01-31 00:00:00', end_date: '2039-12-08 23:59:59' },
    { coupon_id: '34899', title: 'CPtest QNa01', discount: '', start_date: '2026-02-13 11:00:00', end_date: '2027-02-28 12:00:59' },
    { coupon_id: '34610', title: '989898_Payment_N=null', discount: '', start_date: '2025-12-01 12:00:00', end_date: '2026-12-01 12:00:59' },
    { coupon_id: '34320', title: '5047_Payment one-time only', discount: '', start_date: '2025-12-01 12:00:00', end_date: '2026-12-01 12:00:59' },
    { coupon_id: '33809', title: 'Superb Coupon for APP 090909 Platinum Superb Payment coupon  - for Platinum only ( 50%)', discount: '', start_date: '2025-10-05 12:00:00', end_date: '2026-10-05 12:00:59' },
    { coupon_id: '32211', title: '★ビーフ100%粗挽き肉厚ステーキ風ハンバーグ', discount: '495〜545', start_date: '2025-05-29 00:00:00', end_date: '2032-06-01 23:59:59' },
  ]

  await knex('campaign_coupons').insert(
    coupons.map((c) => ({
      campaign_id: campaignId,
      coupon_id: c.coupon_id,
      title: c.title,
      discount: fmtDiscount(c.discount),
      start_date: fmtDate(c.start_date, fallbackStart),
      end_date: fmtDate(c.end_date, fallbackEnd),
      weight: 1,
    })),
  )
}
