export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    
    if (!YOUTUBE_API_KEY) {
      return res.status(500).json({ 
        error: 'YouTube API key not configured' 
      });
    }

    const { action, query, videoId, maxResults = 10 } = req.body;
    let apiUrl = '';
    
    switch (action) {
      case 'search':
        apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
        break;
      
      case 'videoDetails':
        apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
        break;
      
      case 'transcript':
        // Note: YouTube API doesn't provide direct transcript access
        // You'll need to use youtube-transcript library or similar
        return res.status(200).json({ 
          error: 'Transcript feature requires additional setup' 
        });
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error });
    }
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('YouTube API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}