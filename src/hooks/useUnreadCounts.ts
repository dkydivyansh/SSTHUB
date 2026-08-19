import { useState, useEffect } from 'react';

let globalUnreadCommunity = 0;
let globalUnreadSocial = 0;
let isFetching = false;
let subscribers: (() => void)[] = [];
let intervalId: any = null;

const notifySubscribers = () => {
  subscribers.forEach(sub => sub());
};

const fetchCounts = async () => {
  if (isFetching) return;
  isFetching = true;
  try {
    const res = await fetch('/api/unread_counts');
    const json = await res.json();
    if (json.status === 'success') {
      globalUnreadCommunity = json.data.community;
      globalUnreadSocial = json.data.social;
      notifySubscribers();
    }
  } catch (err) {
    console.error('Failed to fetch unread counts', err);
  } finally {
    isFetching = false;
  }
};

export function useUnreadCounts() {
  const [unreadCommunity, setUnreadCommunity] = useState(globalUnreadCommunity);
  const [unreadSocial, setUnreadSocial] = useState(globalUnreadSocial);

  useEffect(() => {
    const handleUpdate = () => {
      setUnreadCommunity(globalUnreadCommunity);
      setUnreadSocial(globalUnreadSocial);
    };

    subscribers.push(handleUpdate);

    // Only start the fetcher and interval if this is the first subscriber
    if (subscribers.length === 1) {
      fetchCounts();
      intervalId = setInterval(fetchCounts, 5000);
    }

    return () => {
      subscribers = subscribers.filter(sub => sub !== handleUpdate);
      // Clean up the interval if no components are listening anymore
      if (subscribers.length === 0 && intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  }, []);

  return { 
    unreadCommunity, 
    setUnreadCommunity: (val: number) => { globalUnreadCommunity = val; notifySubscribers(); }, 
    unreadSocial, 
    setUnreadSocial: (val: number) => { globalUnreadSocial = val; notifySubscribers(); } 
  };
}
