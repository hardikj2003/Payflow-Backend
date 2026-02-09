import express from 'express';

const app = express();

app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

app.listen(3000, () => {
    console.log("API Gateway is running on port 3000");
})

