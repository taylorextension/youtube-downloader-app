# Backend - YouTube Downloader API
FROM node:20-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl

# Instalar yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json
COPY backend/package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código
COPY backend/src/ ./src/

# Criar diretório de downloads
RUN mkdir -p /app/downloads

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicialização
CMD ["node", "src/server.js"]
