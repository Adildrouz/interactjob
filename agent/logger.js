import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR     = path.join(__dirname, '../logs');
const IS_PROD      = process.env.NODE_ENV === 'production';

let logFilePath = null;

export function initLogger() {
  if (IS_PROD) return; // Railway: stdout only, no log files
  const date = new Date().toISOString().split('T')[0];
  fs.ensureDirSync(LOGS_DIR);
  logFilePath = path.join(LOGS_DIR, `agent-${date}.log`);
}

export function log(message) {
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2, '0');
  const mm  = String(now.getMinutes()).padStart(2, '0');
  const ss  = String(now.getSeconds()).padStart(2, '0');
  const line = `[${hh}:${mm}:${ss}] ${message}`;

  // Always log to stdout (Railway captures this)
  console.log(line);

  // Write to file only when running locally
  if (!IS_PROD && logFilePath) {
    try {
      fs.appendFileSync(logFilePath, line + '\n');
    } catch {
      // Never let logging crash the agent
    }
  }
}
