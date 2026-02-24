const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');
const cron = require('node-cron');

const downloadRoutes = require('./routes/download');
const infoRoutes = require('./routes/info');

const app = express();
const PORT = process.env.PORT || 3000;
const DOWNLOADS_DIR = path.join(__dirname, '../downloads');

// Criar diretório de downloads
fs.ensureDirSync(DOWNLOADS_DIR);

// Limpeza automática de arquivos antigos (a cada hora)
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Limpando arquivos antigos...');
  const files = await fs.readdir(DOWNLOADS_DIR);
  const now = Date.now();
  
  for (const file of files) {
    const filePath = path.join(DOWNLOADS_DIR, file);
    const stats = await fs.stat(filePath);
    const age = now - stats.mtime.getTime();
    
    // Deletar arquivos com mais de 24 horas
    if (age > 24 * 60 * 60 * 1000) {
      await fs.remove(filePath);
      console.log(`[CRON] Removido: ${file}`);
    }
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 requisições por IP
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' }
});

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use('/api/', limiter);

// Servir arquivos estáticos (downloads)
app.use('/downloads', express.static(DOWNLOADS_DIR, {
  setHeaders: (res, filePath) => {
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rotas
app.use('/api/download', downloadRoutes);
app.use('/api/info', infoRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Downloads: ${DOWNLOADS_DIR}`);
});

module.exports = app;
