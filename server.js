import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const dist = path.join(__dirname, 'dist');

app.use(express.static(dist, { maxAge: '1h', extensions: ['html'] }));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`NEXORA LUXE production server listening on 0.0.0.0:${PORT}`);
});
