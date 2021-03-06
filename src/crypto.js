const crypto = require('crypto')

function createHash(payload) {
  let sha256 = crypto.createHash('sha256')
  sha256.update(payload)
  return sha256.digest('hex')
}

function hmacHex(data, signingKey) {
  let hmac = crypto.createHmac('sha256', signingKey)
  hmac.update(data)
  return hmac.digest('hex')
}

function derivePublicKey(p){
    return crypto.createPublicKey(p).export({
        type: 'spki',
        format: 'pem'
    })
}

function encryptToPublic(pub, info){
    return crypto.publicEncrypt(pub, Buffer(info)).toString('hex')
}

function decryptFromPrivate(priv, hiddenInfo){
    return crypto.privateDecrypt(priv, Buffer.from(hiddenInfo, 'hex') ).toString('latin1')
}

module.exports = {
    createHash,
    hmacHex,
    encryptToPublic,
    decryptFromPrivate,
    derivePublicKey
}
