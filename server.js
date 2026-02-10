
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

// CONFIGURAÇÃO DE DIRETÓRIO (Aqui você define onde os arquivos serão salvos)
const UPLOAD_DIR = path.join(__dirname, 'public', 'PDF');
const DB_FILE = path.join(__dirname, 'database.json');

// Garante que a pasta e o arquivo de banco existam
fs.ensureDirSync(UPLOAD_DIR);
if (!fs.existsSync(DB_FILE)) {
  fs.writeJsonSync(DB_FILE, { invoices: [], suppliers: [], users: [] });
}

app.use(cors());
app.use(express.json());

// Serve o frontend (após o build)
app.use(express.static(path.join(__dirname, 'dist')));

// Serve a pasta de PDFs para visualização e download no navegador
app.use('/PDF', express.static(UPLOAD_DIR));

// Configuração do Multer para salvar o arquivo com o nome original
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// ROTA PARA UPLOAD FÍSICO
app.post('/api/upload-file', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('Nenhum arquivo enviado.');
  res.json({ message: 'Arquivo salvo com sucesso', filename: req.file.originalname });
});

// ROTAS PARA O BANCO DE DADOS JSON
app.get('/api/data', async (req, res) => {
  const data = await fs.readJson(DB_FILE);
  res.json(data);
});

app.post('/api/save', async (req, res) => {
  await fs.writeJson(DB_FILE, req.body);
  res.json({ message: 'Dados salvos com sucesso' });
});

// Redireciona todas as outras rotas para o index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`--------------------------------------------------`);
  console.log(`PORTAL DE NOTAS RODANDO NA REDE`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Rede: Acesse pelo IP da sua máquina na porta ${PORT}`);
  console.log(`Arquivos sendo salvos em: ${UPLOAD_DIR}`);
  console.log(`--------------------------------------------------`);
});
