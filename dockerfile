FROM node:18

# Install Python and FFmpeg
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg

# Force update yt-dlp to the latest version to bypass blocks
RUN pip3 install --upgrade yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
