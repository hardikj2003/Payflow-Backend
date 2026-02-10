const express = require("express");
const crypto = require("crypto");

const SECRET = "dev_secret";

function verifySignature(payload, signature) {
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");

  return expected === signature;
}

const app = express();

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.post("/webhook", (req, res) => {

  const signature = req.headers["x-payflow-signature"];

  if (!verifySignature(req.rawBody, signature)) {
    console.log("❌ Invalid signature");
    return res.status(400).send("Invalid signature");
  }

  console.log("✅ Verified webhook:", req.body);
  res.sendStatus(200);
});

app.listen(4000, () => console.log("Secure webhook receiver running"));

//7cdb8a27-ee6a-4769-a3ef-c99431992a20