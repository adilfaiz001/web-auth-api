const crypto = require('crypto');

exports.getHash = (password,salt) => {
  var hmac = crypto.createHmac('sha512',salt);
  hmac.update(password);
  gen_hmac = hmac.digest('hex');
  return gen_hmac;
}
