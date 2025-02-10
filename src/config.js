const dotenv = require("dotenv");
const path = require("path");

function loadConfig() {
  // Load environment variables from .env file
  dotenv.config({ path: path.join(__dirname, "..", ".env") });

  const requiredVars = [
    "HIBISCUS_URL",
    "HIBISCUS_USERNAME",
    "HIBISCUS_PASSWORD",
    "ACTUAL_SERVER_URL",
    "ACTUAL_SYNC_ID",
    "ACTUAL_PASSWORD",
  ];

  // Validate required environment variables
  const missing = requiredVars.filter((varName) => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  const dataDir = path.join(__dirname, "..", "data");

  return {
    hibiscusUrl: process.env.HIBISCUS_URL,
    hibiscusUsername: process.env.HIBISCUS_USERNAME,
    hibiscusPassword: process.env.HIBISCUS_PASSWORD,
    actualServerUrl: process.env.ACTUAL_SERVER_URL,
    actualPassword: process.env.ACTUAL_PASSWORD,
    actualSyncId: process.env.ACTUAL_SYNC_ID,
    dataDir,
  };
}

module.exports = {
  loadConfig,
};
