import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USAGE_PATH = path.join(__dirname, '../data/token-usage.json');

/**
 * OPTIMIZATION 1: Log token usage for each function
 * Tracks input/output tokens per function to calculate daily cost
 */
export async function logTokenUsage(functionName, inputTokens, outputTokens) {
  try {
    let usage = {};

    // Read existing usage file if it exists
    try {
      usage = await fs.readJson(USAGE_PATH);
      if (!usage.date || usage.date !== new Date().toISOString().split('T')[0]) {
        // Reset daily counter if it's a new day
        usage = { date: new Date().toISOString().split('T')[0], functions: {} };
      }
    } catch {
      usage = { date: new Date().toISOString().split('T')[0], functions: {} };
    }

    // Initialize function entry if it doesn't exist
    if (!usage.functions[functionName]) {
      usage.functions[functionName] = { input: 0, output: 0, calls: 0, cost: 0 };
    }

    // Add tokens
    usage.functions[functionName].input += inputTokens;
    usage.functions[functionName].output += outputTokens;
    usage.functions[functionName].calls += 1;

    // Calculate cost: $0.000003/input + $0.000015/output
    usage.functions[functionName].cost =
      (usage.functions[functionName].input * 0.000003) +
      (usage.functions[functionName].output * 0.000015);

    // Calculate daily total
    usage.totalInput = Object.values(usage.functions).reduce((sum, f) => sum + f.input, 0);
    usage.totalOutput = Object.values(usage.functions).reduce((sum, f) => sum + f.output, 0);
    usage.totalCost = Object.values(usage.functions).reduce((sum, f) => sum + f.cost, 0);

    await fs.writeJson(USAGE_PATH, usage, { spaces: 2 });
  } catch (err) {
    console.error('Failed to log token usage:', err);
  }
}

/**
 * OPTIMIZATION 6 & 8: Check daily budget guard (100,000 tokens = ~$0.70/day)
 */
export async function checkDailyBudget(maxTokens = 100000) {
  try {
    let usage = {};
    try {
      usage = await fs.readJson(USAGE_PATH);
    } catch {
      return true; // Allow if no usage file yet
    }

    const totalUsed = (usage.totalInput || 0) + (usage.totalOutput || 0);
    if (totalUsed > maxTokens) {
      console.error(`[BUDGET] Daily token limit exceeded: ${totalUsed}/${maxTokens}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to check daily budget:', err);
    return true; // Allow on error to not block operations
  }
}

/**
 * Get current daily usage report
 */
export async function getDailyReport() {
  try {
    const usage = await fs.readJson(USAGE_PATH);
    return usage;
  } catch {
    return null;
  }
}
