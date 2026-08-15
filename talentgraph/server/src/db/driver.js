import neo4j from "neo4j-driver";
import "dotenv/config";

const { COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD } = process.env;

if (!COGNODB_URI || !COGNODB_USER || !COGNODB_PASSWORD) {
  console.error(
    "[db] Missing CognoDB connection env vars. Copy server/.env.example to server/.env and fill in " +
      "COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD from your CognoDB Cloud console instance."
  );
}

// CognoDB speaks openCypher over Bolt 5.0–5.4 and works with the standard
// Neo4j driver — no custom SDK needed, just point it at the bolt+s:// URI.
export const driver = neo4j.driver(
  COGNODB_URI,
  neo4j.auth.basic(COGNODB_USER, COGNODB_PASSWORD),
  { maxConnectionPoolSize: 20 } // stay well under the free tier's 200 connection cap
);

let verified = false;
let lastError = null;

export async function verifyConnectivity() {
  try {
    await driver.verifyConnectivity();
    verified = true;
    lastError = null;
    console.log("[db] Connected to CognoDB.");
  } catch (err) {
    verified = false;
    lastError = err.message;
    console.error("[db] Could not reach CognoDB:", err.message);
  }
  return verified;
}

export function getConnectionStatus() {
  return { connected: verified, error: lastError };
}

/**
 * Run a single Cypher statement with parameters in a managed session.
 * Every query in this app goes through here so nothing is ever
 * string-concatenated into Cypher.
 */
export async function runQuery(cypher, params = {}) {
  if (!verified) {
    const err = new Error(
      "Database is unreachable. Check CognoDB is running and your .env credentials are correct."
    );
    err.code = "DB_UNAVAILABLE";
    throw err;
  }
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

export async function closeDriver() {
  await driver.close();
}
