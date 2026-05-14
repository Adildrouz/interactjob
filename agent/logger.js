import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.join(__dirname, '../logs');

let logFilePath = null;

export function initLogger() {
  const date = new Date().toISOString().split('T')[0];
  fs.ensureDirSync(LOGS_DIR);
  logFilePath = path.join(LOGS_DIR, `agent-${date}.log`);
}

export function log(message) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const line = `[${hh}:${mm}:${ss}] ${message}`;
  console.log(line);
  if (logFilePath) {
    try {
      fs.appendFileSync(logFilePath, line + '\n');
    } catch {
      // Never let logging crash the agent
    }
  }
}
