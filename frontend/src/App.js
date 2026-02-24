import React, { useState } from 'react';
import { Download, Music, Video, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || '';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [downloadType, setDownloadType] = useState('video'); // 'video' ou 'audio'
  const [selectedQuality, setSelectedQuality] = useState('720');
  const [selectedBitrate, setSelectedBitrate] = useState('192');

  const fetchVideoInfo = async () => {
    if (!url) {
      toast.error('Por favor, insira uma URL do YouTube');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/info/video`, { url });
      setVideoInfo(response.data);
      toast.success('Informações do vídeo carregadas!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao carregar informações');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    const downloadToast = toast.loading('Iniciando download...');

    try {
      let response;
      
      if (downloadType === 'video') {
        response = await axios.post(`${API_URL}/api/download/video`, {
          url,
          quality: selectedQuality
        });
      } else {
        response = await axios.post(`${API_URL}/api/download/audio`, {
          url,
          bitrate: selectedBitrate
        });
      }

      if (response.data.success) {
        toast.success('Download concluído!', { id: downloadToast });
        
        // Iniciar download do arquivo
        const downloadUrl = `${API_URL}${response.data.downloadUrl}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = response.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Limpar após alguns segundos
        setTimeout(() => {
          axios.delete(`${API_URL}/api/download/${response.data.id}`);
        }, 30000);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro no download', { id: downloadToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <Toaster position="top-center" />
      
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
            <Download className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            YouTube Downloader
          </h1>
          <p className="text-white/70">
            Baixe vídeos e áudios do YouTube em alta qualidade
          </p>
        </div>

        {/* URL Input */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <label className="block text-white/80 text-sm mb-2">
            URL do YouTube
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
            />
            <button
              onClick={fetchVideoInfo}
              disabled={loading || !url}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Buscar'
              )}
            </button>
          </div>
        </div>

        {/* Video Info */}
        {videoInfo && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <div className="flex gap-4 mb-6">
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                className="w-32 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1 line-clamp-2">
                  {videoInfo.title}
                </h3>
                <p className="text-white/60 text-sm">
                  {videoInfo.uploader}
                </p>
                <p className="text-white/40 text-xs mt-1">
                  {Math.floor(videoInfo.duration / 60)}:{String(videoInfo.duration % 60).padStart(2, '0')}
                </p>
              </div>
            </div>

            {/* Download Type Selection */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setDownloadType('video')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                  downloadType === 'video'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <Video className="w-5 h-5" />
                Vídeo
              </button>
              
              <button
                onClick={() => setDownloadType('audio')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                  downloadType === 'audio'
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <Music className="w-5 h-5" />
                Áudio MP3
              </button>
            </div>

            {/* Quality Selection */}
            {downloadType === 'video' ? (
              <div className="mb-6">
                <label className="block text-white/80 text-sm mb-2">
                  Qualidade do Vídeo
                </label>
                <select
                  value={selectedQuality}
                  onChange={(e) => setSelectedQuality(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                >
                  <option value="360">360p (Econômico)</option>
                  <option value="480">480p (SD)</option>
                  <option value="720">720p (HD)</option>
                  <option value="1080">1080p (Full HD)</option>
                  <option value="4k">4K (Ultra HD)</option>
                </select>
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-white/80 text-sm mb-2">
                  Qualidade do Áudio
                </label>
                <select
                  value={selectedBitrate}
                  onChange={(e) => setSelectedBitrate(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                >
                  <option value="128">128 kbps (Boa)</option>
                  <option value="192">192 kbps (Alta)</option>
                  <option value="256">256 kbps (Premium)</option>
                  <option value="320">320 kbps (Máxima)</option>
                </select>
              </div>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                downloadType === 'video'
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-green-500 hover:bg-green-600'
              } disabled:opacity-50 text-white flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  {downloadType === 'video' ? 'Baixar Vídeo' : 'Baixar MP3'}
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-white/40 text-sm pb-8">
          <p>Os arquivos são removidos automaticamente após 24 horas</p>
          <p className="mt-2">Respeite os direitos autorais ao usar este serviço</p>
        </div>
      </div>
    </div>
  );
}

export default App;
