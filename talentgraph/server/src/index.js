import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { router } from "./routes/api.js";
import { verifyConnectivity } from "./db/driver.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());
app.use("/api", router);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../../client/dist")));

// API root route
app.get("/api", (req, res) => {
  res.json({ name: "TalentGraph API", status: "ok" });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
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
