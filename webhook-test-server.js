const express = require("express");
const app = express();

app.use(express.json());

app.post("/webhook", (req, res) => {
  console.log("Webhook received:", req.body);
  res.sendStatus(200);
});

app.listen(4000, () => console.log("Webhook receiver on 4000"));
//7cdb8a27-ee6a-4769-a3ef-c99431992a20