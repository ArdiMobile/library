FROM node:18-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    python3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp

# Verify yt-dlp installation
RUN yt-dlp --version

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application files
COPY . .

EXPOSE 3000

CMD ["npm", "start"]