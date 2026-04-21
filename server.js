const express = require('express');
const cors = require('cors');
const { exec } = require('youtube-dl-exec');
const path = require('path');

const app = express();
app.use(cors());

// This specifically fixes the "Cannot GET /" error
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint for video info
app.get('/api/info', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: "No URL provided" });

    try {
        const output = await exec(videoUrl, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        });

        res.json({
            title: output.title,
            url: output.url,
            thumbnail: output.thumbnail
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch video details." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is live on port ${PORT}`));
