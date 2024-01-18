const crypto = require("crypto");

function createHmacPayload(payload, secret) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest("hex");
}

const payload = {
  /* your mock payload here */
};
const secret = "yourHmacSecretKey"; // Replace with your HMAC secret
const encryptedPayload = createHmacPayload(payload, secret);

console.log(encryptedPayload);
