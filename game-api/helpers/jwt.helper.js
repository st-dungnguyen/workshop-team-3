'use strict'

const jwt = require('jsonwebtoken')
const jwksRsa = require('jwks-rsa')

let jwksClient = null

function getJwksClient(issuer) {
  if (!jwksClient) {
    jwksClient = jwksRsa({
      jwksUri: `${issuer}/.well-known/jwks.json`,
      cache: true,
      cacheMaxAge: 10 * 60 * 1000,
    })
  }
  return jwksClient
}

function getSigningKey(client, kid) {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) reject(err)
      else resolve(key.getPublicKey())
    })
  })
}

async function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token')
  }

  const env = process.env.ENV || 'local'

  if (env === 'local') {
    return { sub: 'local-dev-user', iss: 'local' }
  }

  if (env !== 'prod') {
    const decoded = jwt.decode(token)
    if (!decoded) throw new Error('Malformed token')
    return decoded
  }

  const issuer = process.env.AUTH0_ISSUER
  if (!issuer) throw new Error('AUTH0_ISSUER not configured')

  const decoded = jwt.decode(token, { complete: true })
  if (!decoded) throw new Error('Malformed token')

  const client = getJwksClient(issuer)
  const signingKey = await getSigningKey(client, decoded.header.kid)

  return jwt.verify(token, signingKey, {
    issuer,
    algorithms: ['RS256'],
  })
}

function extractBearerToken(request) {
  const auth = request.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7)
}

module.exports = { verifyToken, extractBearerToken }
