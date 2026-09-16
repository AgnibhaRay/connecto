'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { UserProfile } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export default function UserManagementDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const usersList = querySnapshot.docs.map(doc => {
        const data = doc.data();
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

  const toggleUserStatus = async (user: UserProfile, field: 'isVerified' | 'isAdmin') => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        [field]: !user[field],
        updatedAt: serverTimestamp()
      });

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

  const handleBulkAction = async (action: 'verify' | 'unverify' | 'suspend') => {
    try {
      await Promise.all(
        selectedUsers.map(uid => {
          const userRef = doc(db, 'users', uid);
          switch (action) {
            case 'verify':
              return updateDoc(userRef, { isVerified: true, updatedAt: serverTimestamp() });
            case 'unverify':
              return updateDoc(userRef, { isVerified: false, updatedAt: serverTimestamp() });
            case 'suspend':
              return updateDoc(userRef, { isSuspended: true, updatedAt: serverTimestamp() });
          }
        })
      );

      await fetchUsers();
      toast.success(`Bulk action completed successfully`);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'verified') return matchesSearch && user.isVerified;
    if (statusFilter === 'unverified') return matchesSearch && !user.isVerified;
    if (statusFilter === 'admin') return matchesSearch && user.isAdmin;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="">
        <p className="text-center text-felt-gray">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="section-whisper">Users.</h3>
              <p className="mt-4 max-w-2xl text-[16px] text-felt-gray">
                Manage user verification and admin status
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href="/admin/moderation" className="btn-ghost">
                Content Moderation
              </Link>
              <Link href="/admin/activity" className="btn-ghost">
                Activity Logs
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Search and filters */}
            <div className="flex gap-4 flex-grow">
              <input
                type="text"
                placeholder="Search users..."
                className="input-field max-w-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="select-field"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="admin">Admins</option>
              </select>
              <select
                className="select-field"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="createdAt">Join Date</option>
                <option value="displayName">Name</option>
                <option value="email">Email</option>
              </select>
            </div>

            {/* Bulk actions */}
            {selectedUsers.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('verify')}
                  className="btn-ghost btn-sm"
                >
                  Verify Selected
                </button>
                <button
                  onClick={() => handleBulkAction('unverify')}
                  className="btn-ghost btn-sm"
                >
                  Unverify Selected
                </button>
                <button
                  onClick={() => handleBulkAction('suspend')}
                  className="btn-ghost btn-sm"
                >
                  Suspend Selected
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-obsidian/15">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-obsidian/15">
            <thead className="">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-felt-gray uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded border-obsidian text-obsidian  focus:border-pewter focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    checked={selectedUsers.length === filteredUsers.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(u => u.uid));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-felt-gray uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-felt-gray uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-felt-gray uppercase tracking-wider">
                  Username
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-felt-gray uppercase tracking-wider">
                  Join Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-felt-gray uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-felt-gray uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-obsidian/15">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className={user.isSuspended ? '' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-obsidian text-obsidian  focus:border-pewter focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      checked={selectedUsers.includes(user.uid)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.uid]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.uid));
                        }
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 relative  overflow-hidden">
                        <Image
                          src={user.photoURL || '/images/default-avatar.png'}
                          alt={user.displayName || ''}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-obsidian">{user.displayName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-obsidian">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-obsidian">@{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-obsidian">
                      {user.createdAt && (
                        user.createdAt instanceof Date ? 
                          formatDistanceToNow(user.createdAt, { addSuffix: true }) :
                          user.createdAt instanceof Timestamp ?
                            formatDistanceToNow(user.createdAt.toDate(), { addSuffix: true }) :
                            'Unknown date'
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {user.isVerified && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold  tag-pill">
                          Verified
                        </span>
                      )}
                      {user.isAdmin && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold  tag-pill">
                          Admin
                        </span>
                      )}
                      {user.isSuspended && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold  tag-pill">
                          Suspended
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleUserStatus(user, 'isVerified')}
                        className="nav-link text-obsidian"
                      >
                        {user.isVerified ? 'Unverify' : 'Verify'}
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user, 'isAdmin')}
                        className="nav-link text-obsidian ml-4"
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
