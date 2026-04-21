const express = require('express');
const cors = require('cors');
const { exec } = require('youtube-dl-exec');
const path = require('path');

const app = express();
app.use(cors());

// Serves the UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// The downloader logic with bypass flags
app.get('/api/info', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: "No URL provided" });

    try {
        const output = await exec(videoUrl, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            // Mimics a real Chrome browser fingerprint
            impersonate: 'chrome',
            addHeader: [
                'referer:https://www.youtube.com/',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            ]
        });

        res.json({
            title: output.title,
            url: output.url,
            thumbnail: output.thumbnail
        });
    } catch (error) {
        console.error("Extraction Error:", error);
        res.status(500).json({ 
            error: "YouTube is blocking the request. Try again in a few minutes or use a different link." 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
