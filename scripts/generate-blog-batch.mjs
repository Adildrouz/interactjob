/**
 * Generates N blog articles sequentially by calling writeBlogArticle()
 * Usage: node scripts/generate-blog-batch.mjs [count]
 * Default: 10 articles
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Load env from agent/.env using process.env directly
import fs from 'fs';
const envPath = path.join(__dirname, '../agent/.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...rest] = line.split('=');
    if (k && rest.length && !process.env[k.trim()]) {
      process.env[k.trim()] = rest.join('=').trim();
    }
  });
}

const { writeBlogArticle } = await import('../agent/blog-writer.js');

const COUNT = parseInt(process.argv[2] || '10', 10);
console.log(`\n🚀 Generating ${COUNT} blog articles...\n`);

let success = 0;
let failed = 0;

for (let i = 0; i < COUNT; i++) {
  console.log(`\n─── Article ${i + 1}/${COUNT} ───`);
  try {
    await writeBlogArticle();
    success++;
    // 3s pause between articles to avoid Claude rate limits
    if (i < COUNT - 1) await new Promise(r => setTimeout(r, 3000));
  } catch (err) {
    console.error(`✗ Error on article ${i + 1}:`, err.message);
    failed++;
  }
}

console.log(`\n✅ Done — ${success} generated, ${failed} failed`);
