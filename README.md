# YouTube Downloader

Aplicativo completo para baixar vídeos e áudios do YouTube.

## Funcionalidades

- 📥 Baixar vídeos em múltiplas resoluções (360p, 480p, 720p, 1080p, 4K)
- 🎵 Baixar áudio em MP3 (128kbps, 192kbps, 256kbps, 320kbps)
- 💾 Salvar arquivos localmente
- 🗑️ Limpeza automática de arquivos antigos
- 🚀 Deploy no Railway

## Tecnologias

- **Backend:** Node.js, Express, yt-dlp
- **Frontend:** React, Tailwind CSS
- **Deploy:** Docker, Railway

## Estrutura

```
youtube-downloader-app/
├── backend/          # API Node.js
│   ├── src/
│   │   ├── server.js
│   │   └── routes/
│   └── Dockerfile
├── frontend/         # React App
│   ├── src/
│   │   └── App.js
│   └── Dockerfile
├── docker-compose.yml
└── railway.json
```

## Deploy no Railway

1. Criar projeto no Railway
2. Conectar repositório GitHub
3. Configurar variáveis de ambiente (se necessário)
4. Deploy automático

## Desenvolvimento Local

```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm start

# Docker Compose (tudo junto)
docker-compose up --build
```

## API Endpoints

### POST /api/info/video
Obter informações do vídeo

```json
{
  "url": "https://youtube.com/watch?v=..."
}
```

### POST /api/download/video
Baixar vídeo

```json
{
  "url": "https://youtube.com/watch?v=...",
  "quality": "720"
}
```

### POST /api/download/audio
Baixar áudio MP3

```json
{
  "url": "https://youtube.com/watch?v=...",
  "bitrate": "192"
}
```

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | 3000 |
| `NODE_ENV` | Ambiente | production |
| `FRONTEND_URL` | URL do frontend | * |

## Licença

MIT - Use por sua conta e responsabilidade.
Respeite os direitos autorais.
