import { useState, useEffect } from 'react';

export function useUnreadCounts() {
  const [unreadCommunity, setUnreadCommunity] = useState(0);
  const [unreadSocial, setUnreadSocial] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/unread_counts');
        const json = await res.json();
        if (json.status === 'success') {
          setUnreadCommunity(json.data.community);
          setUnreadSocial(json.data.social);
        }
      } catch (err) {
        console.error('Failed to fetch unread counts', err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return { unreadCommunity, setUnreadCommunity, unreadSocial, setUnreadSocial };
}
