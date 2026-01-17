const express = require('express');
const router = express.Router();
const { fetchLinkPreview } = require('../utils/linkPreview');

// GET /api/link-preview?url=<url>
router.get('/', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }

    const result = await fetchLinkPreview(url);

    if (result.success) {
      return res.json({
        success: true,
        preview: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Link preview route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;