import { useState, useEffect } from 'react';

export function useGroupUnreadCounts(groupId: string) {
  const [counts, setCounts] = useState({ announcements: 0, events: 0 });

  useEffect(() => {
    if (!groupId) return;

    const fetchCounts = async () => {
      try {
        const res = await fetch(`/api/group_unread_counts?group_id=${groupId}`);
        const json = await res.json();
        if (json.status === 'success') {
          setCounts(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch group unread counts', err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [groupId]);

  const markRead = async (type: 'announcements' | 'events') => {
    if (!groupId) return;
    try {
      await fetch('/api/mark_group_read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId, type })
      });
      // Optimistically clear the count
      setCounts(prev => ({ ...prev, [type]: 0 }));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  return { counts, markRead };
}
