const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

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
app.use(express.static(__dirname));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API: Get video info
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
    // Use yt-dlp binary directly for reliable JSON parsing
    const command = `yt-dlp -j --no-warnings --prefer-free-formats -f "bestvideo+bestaudio/best" "${videoUrl}"`;
    const { stdout } = await execPromise(command, { 
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 5 // 5MB buffer for large JSON
    });
    
    const output = JSON.parse(stdout);

    const formats = (output.formats || [])
      .filter(f =>
        f.ext === 'mp4' &&
        f.vcodec !== 'none' &&
        f.acodec !== 'none' &&
        f.url
      )
      .map(f => ({
        quality: f.format_note || (f.height ? f.height + "p" : "unknown"),
        format_id: f.format_id,
        size: f.filesize || f.filesize_approx || null,
        ext: f.ext
      }))
      .slice(0, 6);

    if (!formats.length) {
      return res.status(404).json({ error: "No MP4 formats found. Try a different video." });
    }

    res.json({
      title: output.title,
      thumbnail: output.thumbnail,
      duration: output.duration,
      webpage_url: output.webpage_url,
      formats
    });

  } catch (err) {
    console.error("ERROR:", err.message);
    res.status(500).json({
      error: "Failed to fetch video. The link may be invalid or YouTube blocked the request."
    });
  }
});

// API: Download endpoint (proxies the actual download)
app.get('/api/download', async (req, res) => {
  const videoUrl = req.query.url;
  const formatId = req.query.format;

  if (!videoUrl || !formatId) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    // Get the direct download URL
    const command = `yt-dlp -f ${formatId} -g "${videoUrl}"`;
    const { stdout } = await execPromise(command, { timeout: 15000 });
    const downloadUrl = stdout.trim().split('\n')[0];

    if (!downloadUrl) {
      throw new Error('Could not retrieve download URL');
    }

    // Redirect to the actual download URL
    res.redirect(downloadUrl);

  } catch (err) {
    console.error("Download error:", err.message);
    res.status(500).json({ error: "Download failed. Please try again." });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));