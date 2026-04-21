const express = require('express');
const cors = require('cors');
const { exec } = require('youtube-dl-exec');
const app = express();

app.use(cors()); // Allows your website to talk to this API

app.get('/api/info', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) return res.status(400).json({ error: "No URL provided" });

    try {
        const output = await exec(videoUrl, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            preferFreeFormats: true,
            // These headers help prevent YouTube from blocking your server
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        });

        res.json({
            title: output.title,
            url: output.url, // This is the direct streaming URL
            thumbnail: output.thumbnail
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch video" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Engine running on port ${PORT}`));
