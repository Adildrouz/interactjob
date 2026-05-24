// Direct Next.js server startup without npm subprocess
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false; // production mode
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
    console.log(`✓ Server running on http://localhost:${port}`);
  });
});
