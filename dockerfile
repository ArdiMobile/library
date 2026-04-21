FROM node:18

# Install dependencies for yt-dlp
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg

WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy the rest of your files
COPY . .

# Railway uses the PORT environment variable
EXPOSE 3000

CMD ["npm", "start"]
