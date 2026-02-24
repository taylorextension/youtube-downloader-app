const express = require('express');
const YTDlpWrap = require('yt-dlp-wrap').default;

const router = express.Router();
const ytDlp = new YTDlpWrap();

// Obter informações do vídeo
router.post('/video', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }
    
    if (!isValidYouTubeUrl(url)) {
      return res.status(400).json({ error: 'URL do YouTube inválida' });
    }
    
    // Obter metadados
    const metadata = await ytDlp.getVideoInfo(url);
    
    // Extrair formatos de vídeo disponíveis
    const videoFormats = metadata.formats
      .filter(f => f.vcodec !== 'none' && f.acodec !== 'none')
      .map(f => ({
        quality: f.qualityLabel || `${f.height}p`,
        height: f.height,
        width: f.width,
        formatId: f.formatId,
        ext: f.ext,
        filesize: f.filesize || f.filesizeApprox
      }))
      .filter((v, i, a) => a.findIndex(t => t.height === v.height) === i) // Remover duplicatas
      .sort((a, b) => b.height - a.height);
    
    // Extrair formatos de áudio
    const audioFormats = metadata.formats
      .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
      .map(f => ({
        bitrate: f.abr,
        formatId: f.formatId,
        ext: f.ext,
        filesize: f.filesize || f.filesizeApprox
      }))
      .filter(f => f.bitrate)
      .sort((a, b) => b.bitrate - a.bitrate);
    
    res.json({
      id: metadata.id,
      title: metadata.title,
      description: metadata.description,
      duration: metadata.duration,
      thumbnail: metadata.thumbnail,
      uploader: metadata.uploader,
      uploadDate: metadata.upload_date,
      views: metadata.view_count,
      videoFormats,
      audioFormats
    });
    
  } catch (error) {
    console.error('[INFO ERROR]', error);
    res.status(500).json({ 
      error: 'Erro ao obter informações',
      message: error.message 
    });
  }
});

// Verificar se URL é válida (rápido)
router.post('/validate', async (req, res) => {
  try {
    const { url } = req.body;
    const isValid = isValidYouTubeUrl(url);
    
    if (!isValid) {
      return res.json({ valid: false });
    }
    
    // Verificar se vídeo existe (teste rápido)
    try {
      await ytDlp.getVideoInfo(url);
      res.json({ valid: true, exists: true });
    } catch (e) {
      res.json({ valid: true, exists: false, error: 'Vídeo não encontrado ou privado' });
    }
    
  } catch (error) {
    res.status(500).json({ error: 'Erro na validação' });
  }
});

function isValidYouTubeUrl(url) {
  const patterns = [
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+$/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+$/
  ];
  
  return patterns.some(pattern => pattern.test(url));
}

module.exports = router;
