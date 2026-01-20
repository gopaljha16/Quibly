const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

// Fetch link preview metadata
router.get('/', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL parameter is required'
            });
        }

        // Validate URL format
        let validUrl;
        try {
            validUrl = new URL(url);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid URL format'
            });
        }

        // Fetch the page
        const response = await axios.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0)'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Extract metadata
        const metadata = {
            url: url,
            title: $('meta[property="og:title"]').attr('content') ||
                $('meta[name="twitter:title"]').attr('content') ||
                $('title').text() ||
                'No title',
            description: $('meta[property="og:description"]').attr('content') ||
                $('meta[name="twitter:description"]').attr('content') ||
                $('meta[name="description"]').attr('content') ||
                '',
            image: $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content') ||
                '',
            siteName: $('meta[property="og:site_name"]').attr('content') ||
                validUrl.hostname
        };

        res.status(200).json({
            success: true,
            preview: metadata
        });
    } catch (error) {
        console.error('Link preview error:', error.message);

        if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
            return res.status(404).json({
                success: false,
                message: 'Could not fetch URL'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while fetching link preview'
        });
    }
});

module.exports = router;
