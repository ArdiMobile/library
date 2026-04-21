const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const youtubedl = require('youtube-dl-exec');

// Force yt-dlp binary (important for Docker)
const exec = youtubedl.create('/usr/local/bin/yt-dlp');

const app = express();

// 🔐 Basic rate limiting (protect server)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20 // limit each IP
});

app.use(cors());
app.use(limiter);
app.use(express.json());

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 🎬 Main API
app.get('/api/info', async (req, res) => {
  const videoUrl = req.query.url;

  // ❌ Validate URL
  if (!videoUrl || !videoUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
    return res.status(400).json({ error: 'Only YouTube links are supported' });
  }

  try {
    const output = await exec(videoUrl, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      format: "bestvideo+bestaudio/best",
      timeout: 15000,
      impersonate: 'chrome',
      addHeader: [
        'referer:https://www.youtube.com/',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36'
      ]
    });

    // 🎯 Filter MP4 formats (video only)
    const formats = (output.formats || [])
      .filter(f =>
        f.ext === 'mp4' &&
        f.vcodec !== 'none' &&
        f.acodec !== 'none' &&
        f.url
      )
      .map(f => ({
        quality: f.format_note || f.height + "p",
        url: f.url,
        filesize: f.filesize || f.filesize_approx || null
      }))
      .slice(0, 6); // limit results

    if (!formats.length) {
      return res.status(404).json({
        error: "No downloadable formats found. Try another video."
      });
    }

    res.json({
      title: output.title,
      thumbnail: output.thumbnail,
      duration: output.duration,
      formats: formats
    });

  } catch (error) {
    console.error("❌ Extraction Error:", error.message);

    res.status(500).json({
      error: "Failed to fetch video. YouTube may be blocking the request. Try again later."
    });
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});