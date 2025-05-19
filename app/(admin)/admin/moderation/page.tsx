'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, getDocs, doc, updateDoc, where, orderBy, deleteDoc } from 'firebase/firestore';
import { Post, Story } from '@/types';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { logActivity } from '@/lib/utils/activityLogger';

interface ReportedContent {
  id: string;
  type: 'post' | 'story';
  content: Post | Story;
  reportedBy: string[];
  reason: string;
  createdAt: Date;
}

export default function ContentModerationPage() {
  const [reportedContent, setReportedContent] = useState<ReportedContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportedContent = async () => {
      try {
        // Fetch reported posts
        const reportsRef = collection(db, 'reports');
        const q = query(
          reportsRef,
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const reports = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ReportedContent[];
        
        setReportedContent(reports);
      } catch (error) {
        console.error('Error fetching reported content:', error);
        toast.error('Failed to load reported content');
      } finally {
        setLoading(false);
      }
    };

    fetchReportedContent();
  }, []);

  const handleContentAction = async (reportId: string, action: 'approve' | 'remove') => {
    try {
      const report = reportedContent.find(r => r.id === reportId);
      if (!report) return;

      // Update report status
      await updateDoc(doc(db, 'reports', reportId), {
        status: action === 'approve' ? 'approved' : 'removed',
        resolvedAt: new Date()
      });

      // Log the moderation action
      await logActivity({
        action: 'content_moderated',
        userId: report.reportedBy[0], // Use the first reporter's ID
        userName: report.reportedBy[0], // We'll show the ID as name since we don't have the name
        targetId: report.content.id,
        details: `${report.type} ${action === 'approve' ? 'approved' : 'removed'} - Reason: ${report.reason}`
      });

      // If removing content, delete the original content
      if (action === 'remove') {
        const contentRef = doc(db, report.type === 'post' ? 'posts' : 'stories', report.content.id);
        await deleteDoc(contentRef);
        toast.success(`${report.type === 'post' ? 'Post' : 'Story'} has been removed`);
      }

      // Update local state
      setReportedContent(prev => prev.filter(r => r.id !== reportId));
      
    } catch (error) {
      console.error('Error handling content action:', error);
      toast.error('Failed to process action');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-center text-gray-600">Loading reported content...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Content Moderation</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Review and manage reported content</p>
      </div>

      <div className="border-t border-gray-200">
        {reportedContent.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No content has been reported
          </div>
        ) : (
          <div className="flow-root">
            <ul className="divide-y divide-gray-200">
              {reportedContent.map((report) => (
                <li key={report.id} className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {report.type === 'post' ? 'Post' : 'Story'} by {(report.content as Post | Story).authorName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        Reason: {report.reason}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Reported by {report.reportedBy.length} user{report.reportedBy.length !== 1 ? 's' : ''}
                      </p>
                      
                      {report.type === 'post' && (
                        <div className="mt-2 text-sm text-gray-700">
                          <p>{(report.content as Post).content}</p>
                          {(report.content as Post).imageURL && (
                            <div className="mt-2">
                              <Image
                                src={(report.content as Post).imageURL!}
                                alt="Post image"
                                width={200}
                                height={200}
                                className="rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleContentAction(report.id, 'approve')}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleContentAction(report.id, 'remove')}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
