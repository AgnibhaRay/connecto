'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit, startAfter, DocumentData, onSnapshot, Timestamp, getDocs} from 'firebase/firestore';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { ActivityAction } from '@/lib/utils/activityLogger';

interface ActivityLog {
  id: string;
  action: ActivityAction;
  userId: string;
  userName: string;
  targetId?: string;
  details?: string;
  timestamp: Timestamp;
}

export default function ActivityLogPage() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentData | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const logsRef = collection(db, 'activity_logs');
    const q = query(
      logsRef,
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ActivityLog[];
        
        setActivityLogs(logs);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setLoading(false);
      } catch (error) {
        console.error('Error processing activity logs:', error);
        toast.error('Failed to load activity logs');
        setLoading(false);
      }
    }, (error) => {
      console.error('Error in activity logs subscription:', error);
      toast.error('Failed to subscribe to activity logs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const logsRef = collection(db, 'activity_logs');
      const q = query(
        logsRef,
        orderBy('timestamp', 'desc'),
        startAfter(lastDoc),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const newLogs = snapshot.docs.map((doc: DocumentData) => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
      
      setActivityLogs(prev => [...prev, ...newLogs]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    } catch (error) {
      console.error('Error loading more logs:', error);
      toast.error('Failed to load more logs');
    } finally {
      setLoadingMore(false);
    }
  };

  const getActionText = (action: ActivityLog['action'], details?: string) => {
    switch (action) {
      case 'login':
        return 'logged in';
      case 'user_registration':
        return 'registered a new account';
      case 'post_created':
        return 'created a post';
      case 'story_created':
        return 'created a story';
      case 'user_verified':
        return details || 'had verification status updated';
      case 'user_admin_updated':
        return details || 'had admin status updated';
      case 'content_reported':
        return 'reported content';
      case 'content_moderated':
        return details || 'moderated content';
      default:
        return 'performed an action';
    }
  };

  const getActionColor = (action: ActivityLog['action']) => {
    switch (action) {
      case 'user_verified':
      case 'user_admin_updated':
        return 'text-obsidian';
      case 'content_reported':
        return 'text-obsidian';
      case 'content_moderated':
        return 'text-felt-gray';
      default:
        return 'text-felt-gray';
    }
  };

  if (loading && activityLogs.length === 0) {
    return (
      <div className="">
        <p className="text-center text-felt-gray">Loading activity logs...</p>
      </div>
    );
  }

  return (
    <div className="">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="section-whisper">Activity.</h3>
        <p className="mt-4 max-w-2xl text-[16px] text-felt-gray">Monitor user and system activity in real-time</p>
      </div>

      <div className="border-t border-obsidian/15">
        <div className="flow-root">
          <ul className="divide-y divide-obsidian/15">
            {activityLogs.map((log) => (
              <li key={log.id} className="p-4 hover:">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Link href={`/profile?username=${log.userName}`} className="text-sm font-medium nav-link text-obsidian">
                        {log.userName}
                      </Link>
                      <span className={`text-sm ${getActionColor(log.action)}`}>
                        {getActionText(log.action, log.details)}
                      </span>
                    </div>
                    {log.targetId && (
                      <p className="mt-1 text-sm text-felt-gray">
                        Target ID: {log.targetId}
                      </p>
                    )}
                  </div>
                  <time className="text-sm text-felt-gray whitespace-nowrap">
                    {formatDistanceToNow(log.timestamp?.toDate() || new Date(), { addSuffix: true })}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {lastDoc && (
          <div className="px-4 py-4 sm:px-6 border-t border-obsidian/15">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full text-center text-sm nav-link text-obsidian font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
