import { useState } from 'react';

export default function Downloader() {
  const [url, setUrl] = useState('');
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    try {
      // We call our internal proxy path defined in vercel.json
      const response = await fetch(`/api/engine/download?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      setVideoData(data); // This contains the title and the direct download URL
    } catch (error) {
      alert("Error fetching video details");
    }
    setLoading(false);
  };

  return (
    <div className="p-10">
      <input 
        type="text" 
        value={url} 
        onChange={(e) => setUrl(e.target.value)} 
        placeholder="Paste YouTube Link"
        className="border p-2"
      />
      <button onClick={handleFetch} disabled={loading}>
        {loading ? 'Processing...' : 'Get Download Link'}
      </button>

      {videoData && (
        <div className="mt-5">
          <h3>{videoData.title}</h3>
          <a href={videoData.url} download className="bg-green-500 text-white p-2 rounded">
            Download Now
          </a>
        </div>
      )}
    </div>
  );
}
