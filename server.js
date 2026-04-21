const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const youtubedl = require('youtube-dl-exec');

// Use yt-dlp automatically (no hard path issues)
const exec = youtubedl;

const app = express();

// Debug (important for crashes)
process.on('uncaughtException', err => console.error('UNCAUGHT:', err));
process.on('unhandledRejection', err => console.error('REJECTION:', err));

// Security: rate limit
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20
});

app.use(cors());
app.use(limiter);

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API
app.get('/api/info', async (req, res) => {
  const videoUrl = req.query.url;

  // Validation
  if (!videoUrl || !videoUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
    return res.status(400).json({ error: 'Only YouTube links are supported' });
  }

  try {
    const output = await exec(videoUrl, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      format: "bestvideo+bestaudio/best",
      timeout: 15000
    });

    const formats = (output.formats || [])
      .filter(f =>
        f.ext === 'mp4' &&
        f.vcodec !== 'none' &&
        f.acodec !== 'none' &&
        f.url
      )
      .map(f => ({
        quality: f.format_note || (f.height ? f.height + "p" : "unknown"),
        url: f.url,
        size: f.filesize || f.filesize_approx || null
      }))
      .slice(0, 6);

    if (!formats.length) {
      return res.status(404).json({ error: "No formats found" });
    }

    res.json({
      title: output.title,
      thumbnail: output.thumbnail,
      duration: output.duration,
      formats
    });

  } catch (err) {
    console.error("ERROR:", err.message);
    res.status(500).json({
      error: "Failed to fetch video. Try again later."
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));