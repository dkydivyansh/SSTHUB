import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

interface LinkPreviewProps {
  url: string;
}

export default function LinkPreview({ url }: LinkPreviewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        // Check session storage cache
        const cacheKey = `link_preview_${url}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.title || parsed.image)) {
            setData(parsed);
          } else {
            setError(true);
          }
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/link_preview?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        
        if (json.status === 'success' && json.data) {
          const previewData = json.data;
          // Only show if we got at least a title or image
          if (previewData.title || previewData.image) {
             sessionStorage.setItem(cacheKey, JSON.stringify(previewData));
             setData(previewData);
          } else {
             sessionStorage.setItem(cacheKey, JSON.stringify({ error: true }));
             setError(true);
          }
        } else {
          sessionStorage.setItem(cacheKey, JSON.stringify({ error: true }));
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (loading || error || !data) return null;

  try {
    const domain = new URL(url).hostname.replace('www.', '');
    
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex flex-col sm:flex-row border-4 border-black bg-[#f4f4f5] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden mt-2 mb-2 group block no-underline"
      >
        {data.image && (
          <div className="sm:w-32 sm:min-w-[128px] h-32 border-b-4 sm:border-b-0 sm:border-r-4 border-black bg-white overflow-hidden shrink-0">
            <img src={`/api/image_proxy?url=${encodeURIComponent(data.image)}`} alt={data.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          </div>
        )}
        <div className="p-3 flex flex-col justify-center flex-1 min-w-0">
          <h4 className="font-black text-sm uppercase tracking-tighter truncate text-black mb-1 leading-tight">{data.title || domain}</h4>
          {data.description && (
            <p className="text-xs font-bold text-gray-600 line-clamp-2 leading-tight mb-2">{data.description}</p>
          )}
          <div className="flex items-center gap-1 text-[10px] font-black text-gray-500 uppercase tracking-widest mt-auto">
            <ExternalLink size={10} /> {domain}
          </div>
        </div>
      </a>
    );
  } catch (e) {
    return null;
  }
}
