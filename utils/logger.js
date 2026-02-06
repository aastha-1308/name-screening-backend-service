const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "../logs");
const logFile = path.join(logDir, "app.log");

function log(message, meta = {}) {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const { userId, requestId } = meta;

  let context = "";
  if (userId) context += ` [userId : ${userId}]`; // in case the business requirement is such that user id also needs to be logged.
  if (requestId) context += ` [requestId : ${requestId}]`;

  const entry = `[${new Date().toISOString()}]${context} ${message}\n`;
  fs.appendFileSync(logFile, entry);
}

module.exports = { log };
