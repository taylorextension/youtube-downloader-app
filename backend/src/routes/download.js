const express = require('express');
const YTDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const ytDlp = new YTDlpWrap();
const DOWNLOADS_DIR = path.join(__dirname, '../../downloads');

// Download de vídeo
router.post('/video', async (req, res) => {
  try {
    const { url, quality = '720' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }
    
    // Validar URL do YouTube
    if (!isValidYouTubeUrl(url)) {
      return res.status(400).json({ error: 'URL do YouTube inválida' });
    }
    
    const id = uuidv4();
    const outputPath = path.join(DOWNLOADS_DIR, `${id}.%(ext)s`);
    
    // Mapear qualidade para formato
    const formatMap = {
      '360': 'best[height<=360]',
      '480': 'best[height<=480]',
      '720': 'best[height<=720]',
      '1080': 'best[height<=1080]',
      '4k': 'best[height<=2160]',
      'best': 'best'
    };
    
    const format = formatMap[quality] || formatMap['720'];
    
    // Iniciar download
    const downloadProcess = ytDlp.exec([
      url,
      '-f', format,
      '-o', outputPath,
      '--merge-output-format', 'mp4',
      '--no-playlist'
    ]);
    
    let filename = '';
    
    downloadProcess.ytDlpProcess.stdout.on('data', (data) => {
      const output = data.toString();
      // Extrair nome do arquivo do output
      const match = output.match(/\[download\] Destination: (.+)/);
      if (match) {
        filename = path.basename(match[1]);
      }
    });
    
    downloadProcess.on('close', async (code) => {
      if (code === 0) {
        // Encontrar o arquivo baixado
        const files = await fs.readdir(DOWNLOADS_DIR);
        const downloadedFile = files.find(f => f.startsWith(id));
        
        if (downloadedFile) {
          res.json({
            success: true,
            id,
            filename: downloadedFile,
            downloadUrl: `/downloads/${downloadedFile}`,
            quality
          });
        } else {
          res.status(500).json({ error: 'Arquivo não encontrado após download' });
        }
      } else {
        res.status(500).json({ error: 'Falha no download' });
      }
    });
    
    downloadProcess.on('error', (error) => {
      console.error('[DOWNLOAD ERROR]', error);
      res.status(500).json({ error: 'Erro durante o download' });
    });
    
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Download de áudio (MP3)
router.post('/audio', async (req, res) => {
  try {
    const { url, bitrate = '192' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }
    
    if (!isValidYouTubeUrl(url)) {
      return res.status(400).json({ error: 'URL do YouTube inválida' });
    }
    
    const id = uuidv4();
    const outputPath = path.join(DOWNLOADS_DIR, `${id}.mp3`);
    
    // Validar bitrate
    const validBitrates = ['128', '192', '256', '320'];
    const audioBitrate = validBitrates.includes(bitrate) ? bitrate : '192';
    
    const downloadProcess = ytDlp.exec([
      url,
      '-f', 'bestaudio',
      '-o', outputPath,
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', audioBitrate,
      '--no-playlist'
    ]);
    
    downloadProcess.on('close', async (code) => {
      if (code === 0) {
        const files = await fs.readdir(DOWNLOADS_DIR);
        const downloadedFile = files.find(f => f.startsWith(id) && f.endsWith('.mp3'));
        
        if (downloadedFile) {
          res.json({
            success: true,
            id,
            filename: downloadedFile,
            downloadUrl: `/downloads/${downloadedFile}`,
            bitrate: audioBitrate
          });
        } else {
          res.status(500).json({ error: 'Arquivo não encontrado' });
        }
      } else {
        res.status(500).json({ error: 'Falha no download de áudio' });
      }
    });
    
    downloadProcess.on('error', (error) => {
      console.error('[DOWNLOAD ERROR]', error);
      res.status(500).json({ error: 'Erro durante o download' });
    });
    
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Verificar status do download
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const files = await fs.readdir(DOWNLOADS_DIR);
    const file = files.find(f => f.startsWith(id));
    
    if (file) {
      const stats = await fs.stat(path.join(DOWNLOADS_DIR, file));
      res.json({
        exists: true,
        filename: file,
        size: stats.size,
        downloadUrl: `/downloads/${file}`
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar status' });
  }
});

// Deletar arquivo após download
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const files = await fs.readdir(DOWNLOADS_DIR);
    const file = files.find(f => f.startsWith(id));
    
    if (file) {
      await fs.remove(path.join(DOWNLOADS_DIR, file));
      res.json({ success: true, message: 'Arquivo removido' });
    } else {
      res.status(404).json({ error: 'Arquivo não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover arquivo' });
  }
});

// Validador de URL do YouTube
function isValidYouTubeUrl(url) {
  const patterns = [
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+$/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+$/
  ];
  
  return patterns.some(pattern => pattern.test(url));
}

module.exports = router;
