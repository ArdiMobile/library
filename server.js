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
    // Enhanced command with anti-detection measures
    const command = `yt-dlp -j \
      --no-warnings \
      --prefer-free-formats \
      --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
      --extractor-retries 3 \
      --retries 3 \
      -f "bestvideo+bestaudio/best" \
      "${videoUrl}"`;
    
    const { stdout } = await execPromise(command, { 
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 5
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
    
    // More specific error message
    if (err.message.includes('HTTP Error 403')) {
      return res.status(500).json({ 
        error: "YouTube blocked the request. This is a known issue with cloud hosting." 
      });
    }
    
    res.status(500).json({
      error: "Failed to fetch video. The link may be invalid or YouTube blocked the request."
    });
  }
});