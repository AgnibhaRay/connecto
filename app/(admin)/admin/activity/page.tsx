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
        return 'text-indigo-600';
      case 'content_reported':
        return 'text-red-600';
      case 'content_moderated':
        return 'text-orange-600';
      default:
        return 'text-gray-500';
    }
  };

  if (loading && activityLogs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-center text-gray-600">Loading activity logs...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Activity Logs</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Monitor user and system activity in real-time</p>
      </div>

      <div className="border-t border-gray-200">
        <div className="flow-root">
          <ul className="divide-y divide-gray-200">
            {activityLogs.map((log) => (
              <li key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Link href={`/profile?username=${log.userName}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                        {log.userName}
                      </Link>
                      <span className={`text-sm ${getActionColor(log.action)}`}>
                        {getActionText(log.action, log.details)}
                      </span>
                    </div>
                    {log.targetId && (
                      <p className="mt-1 text-sm text-gray-500">
                        Target ID: {log.targetId}
                      </p>
                    )}
                  </div>
                  <time className="text-sm text-gray-500 whitespace-nowrap">
                    {formatDistanceToNow(log.timestamp?.toDate() || new Date(), { addSuffix: true })}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {lastDoc && (
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full text-center text-sm text-indigo-600 hover:text-indigo-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
