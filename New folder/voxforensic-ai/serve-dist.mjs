import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 3000);
const apiTarget = (process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000').replace(/\/$/, '');

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('Frontend build not found. Run `npm run build` before starting this static server.');
  process.exit(1);
}

const app = express();

app.use('/api', express.raw({ type: '*/*', limit: '100mb' }), async (req, res) => {
  try {
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      const lowerKey = key.toLowerCase();

      if (['host', 'connection', 'content-length'].includes(lowerKey)) {
        continue;
      }

      headers.set(key, Array.isArray(value) ? value.join(',') : String(value));
    }

    const response = await fetch(`${apiTarget}${req.originalUrl}`, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    });

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    const body = Buffer.from(await response.arrayBuffer());
    res.send(body);
  } catch (error) {
    res.status(502).json({
      detail: `Backend API is not reachable at ${apiTarget}. Start python api_server.py first.`,
    });
  }
});

app.use(express.static(distDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`VoxForensic frontend: http://localhost:${port}`);
  console.log(`Proxying /api to ${apiTarget}`);
});
