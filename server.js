
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4444;

// CONFIGURAÇÃO DE DIRETÓRIOS
const UPLOAD_DIR = path.join(__dirname, 'public', 'PDF');
const DB_FILE = path.join(__dirname, 'database.json');

// Garante que a infraestrutura de pastas exista
fs.ensureDirSync(UPLOAD_DIR);
if (!fs.existsSync(DB_FILE)) {
  fs.writeJsonSync(DB_FILE, { invoices: [], suppliers: [], users: [] });
}

app.use(cors());
app.use(express.json());

// Serve arquivos estáticos do build (pasta dist)
app.use(express.static(path.join(__dirname, 'dist')));

// Serve a pasta de PDFs para que o frontend consiga exibir as notas
app.use('/PDF', express.static(UPLOAD_DIR));

// Configuração do Multer para preservar nome e extensão original
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Adiciona um timestamp para evitar sobreposição de arquivos com mesmo nome
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// API: Upload de arquivos
app.post('/api/upload-file', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send({ error: 'Nenhum arquivo enviado.' });
  res.json({ 
    message: 'Arquivo salvo com sucesso', 
    filename: req.file.filename,
    path: `/PDF/${req.file.filename}`
  });
});

// API: Buscar dados do banco
app.get('/api/data', async (req, res) => {
  try {
    const data = await fs.readJson(DB_FILE);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao ler banco de dados' });
  }
});

// API: Salvar dados no banco
app.post('/api/save', async (req, res) => {
  try {
    await fs.writeJson(DB_FILE, req.body, { spaces: 2 });
    res.json({ message: 'Dados salvos com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gravar no banco de dados' });
  }
});

// Fallback para SPA (Single Page Application)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build não encontrado. Execute npm run build primeiro.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\x1b[32m%s\x1b[0m`, `--------------------------------------------------`);
  console.log(`\x1b[32m%s\x1b[0m`, `🚀 PORTAL DELP ONLINE EM: http://localhost:${PORT}`);
  console.log(`\x1b[33m%s\x1b[0m`, `📁 Banco de Dados: ${DB_FILE}`);
  console.log(`\x1b[33m%s\x1b[0m`, `📂 Pasta de Notas (PDF): ${UPLOAD_DIR}`);
  console.log(`\x1b[32m%s\x1b[0m`, `--------------------------------------------------`);
});
