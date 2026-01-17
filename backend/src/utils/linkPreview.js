const axios = require('axios');
const cheerio = require('cheerio');

// Extract metadata from HTML
const extractMetadata = (html, url) => {
  const $ = cheerio.load(html);
  
  // Helper function to get meta content
  const getMeta = (name) => {
    return $(`meta[name="${name}"]`).attr('content') ||
           $(`meta[property="${name}"]`).attr('content') ||
           $(`meta[property="og:${name}"]`).attr('content') ||
           $(`meta[name="twitter:${name}"]`).attr('content') ||
           $(`meta[property="twitter:${name}"]`).attr('content');
  };

  // Extract basic metadata
  const title = getMeta('title') || 
                $('meta[property="og:title"]').attr('content') ||
                $('title').text() ||
                '';

  const description = getMeta('description') || 
                     $('meta[property="og:description"]').attr('content') ||
                     $('meta[name="twitter:description"]').attr('content') ||
                     '';

  const image = getMeta('image') ||
                $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content') ||
                $('meta[property="twitter:image:src"]').attr('content') ||
                '';

  const siteName = $('meta[property="og:site_name"]').attr('content') ||
                   $('meta[name="application-name"]').attr('content') ||
                   '';

  const type = $('meta[property="og:type"]').attr('content') || 'website';

  // Get favicon
  let favicon = $('link[rel="icon"]').attr('href') ||
                $('link[rel="shortcut icon"]').attr('href') ||
                $('link[rel="apple-touch-icon"]').attr('href') ||
                '';

  // Convert relative URLs to absolute
  const makeAbsolute = (relativeUrl) => {
    if (!relativeUrl) return '';
    if (relativeUrl.startsWith('http')) return relativeUrl;
    if (relativeUrl.startsWith('//')) return `https:${relativeUrl}`;
    if (relativeUrl.startsWith('/')) {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${relativeUrl}`;
    }
    return new URL(relativeUrl, url).href;
  };

  return {
    title: title.trim().substring(0, 200),
    description: description.trim().substring(0, 300),
    image: makeAbsolute(image),
    favicon: makeAbsolute(favicon),
    siteName: siteName.trim(),
    type,
    url: url
  };
};

// Check if URL is valid and accessible
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

// Fetch link preview data
const fetchLinkPreview = async (url) => {
  try {
    if (!isValidUrl(url)) {
      throw new Error('Invalid URL');
    }

    // Set reasonable timeout and headers
    const response = await axios.get(url, {
      timeout: 10000, // 10 seconds
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      maxContentLength: 5 * 1024 * 1024, // 5MB limit
    });

    // Only process HTML content
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('text/html')) {
      throw new Error('Not HTML content');
    }

    const metadata = extractMetadata(response.data, url);
    
    // Validate that we got useful data
    if (!metadata.title && !metadata.description && !metadata.image) {
      throw new Error('No useful metadata found');
    }

    return {
      success: true,
      data: metadata
    };

  } catch (error) {
    console.error('Link preview error:', error.message);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Extract URLs from message content
const extractUrls = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex) || [];
  
  // Clean URLs (remove trailing punctuation)
  return urls.map(url => {
    return url.replace(/[.,;:!?)\]}]+$/, '');
  }).filter(url => isValidUrl(url));
};

// Special handlers for popular sites
const getSpecialHandler = (url) => {
  const domain = new URL(url).hostname.toLowerCase();
  
  // YouTube
  if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
    return 'youtube';
  }
  
  // Twitter/X
  if (domain.includes('twitter.com') || domain.includes('x.com')) {
    return 'twitter';
  }
  
  // LinkedIn
  if (domain.includes('linkedin.com')) {
    return 'linkedin';
  }
  
  // GitHub
  if (domain.includes('github.com')) {
    return 'github';
  }
  
  return null;
};

module.exports = {
  fetchLinkPreview,
  extractUrls,
  getSpecialHandler,
  isValidUrl
};