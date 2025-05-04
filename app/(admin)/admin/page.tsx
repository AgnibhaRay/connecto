'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '@/types';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        
        const usersList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          // Ensure isVerified and isAdmin fields exist with default values
          return {
            ...data,
            uid: doc.id,
            isVerified: data.isVerified ?? false,
            isAdmin: data.isAdmin ?? false
          };
        }) as UserProfile[];
        
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const toggleUserStatus = async (user: UserProfile, field: 'isVerified' | 'isAdmin') => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        [field]: !user[field],
        updatedAt: new Date()
      });

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.uid === user.uid 
            ? { ...u, [field]: !u[field] }
            : u
        )
      );

      toast.success(`User ${field === 'isAdmin' ? 'admin status' : 'verification status'} updated`);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-center text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">User Management</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage user verification and admin status</p>
      </div>
      <div className="border-t border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.uid}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 relative rounded-full overflow-hidden">
                        <Image
                          src={user.photoURL || '/images/default-avatar.png'}
                          alt={user.displayName}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">@{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {user.isVerified && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Verified
                        </span>
                      )}
                      {user.isAdmin && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleUserStatus(user, 'isVerified')}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {user.isVerified ? 'Unverify' : 'Verify'}
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user, 'isAdmin')}
                        className="text-indigo-600 hover:text-indigo-900 ml-4"
                      >
                        {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}