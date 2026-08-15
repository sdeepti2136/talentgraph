import express from "express";
import cors from "cors";
import "dotenv/config";
import { router } from "./routes/api.js";
import { verifyConnectivity } from "./db/driver.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());
app.use("/api", router);

app.get("/", (req, res) => {
  res.json({ name: "TalentGraph API", status: "ok" });
});

async function start() {
  // Try to connect on boot, but start the server either way — if CognoDB
  // is briefly unreachable, requests fail gracefully with a 503 (see
  // routes/api.js) rather than the whole process crashing.
  await verifyConnectivity();
  app.listen(PORT, () => {
    console.log(`[server] TalentGraph API listening on http://localhost:${PORT}`);
  });
}

start();
