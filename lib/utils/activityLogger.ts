import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type ActivityAction = 
  | 'login'
  | 'user_registration'
  | 'post_created'
  | 'story_created'
  | 'user_verified'
  | 'user_admin_updated'
  | 'content_reported'
  | 'content_moderated';

export interface ActivityLogEntry {
  action: ActivityAction;
  userId: string;
  userName: string;
  targetId?: string;
  details?: string;
  timestamp: Date;
}

export const logActivity = async (logData: Omit<ActivityLogEntry, 'timestamp'>) => {
  try {
    const activityLogsRef = collection(db, 'activity_logs');
    await addDoc(activityLogsRef, {
      ...logData,
      timestamp: serverTimestamp()
    });
    console.log('Logged activity:', logData.action); // Add logging for debugging
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw the error - logging should not disrupt normal operation
  }
};
