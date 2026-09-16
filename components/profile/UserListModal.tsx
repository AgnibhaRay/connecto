'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { UserProfile } from '@/types';

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: UserProfile[];
}

export default function UserListModal({ isOpen, onClose, title, users }: UserListModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="menu-panel w-full max-w-md transform overflow-hidden p-6 text-left align-middle transition-all">
                <Dialog.Title
                  as="h3"
                  className="flex items-center justify-between text-[16px] text-obsidian"
                >
                  {title}
                  <button
                    onClick={onClose}
                    className="p-1 text-felt-gray hover:text-obsidian"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </Dialog.Title>
                <div className="mt-4 max-h-96 overflow-y-auto">
                  {users.map((user) => (
                    <Link
                      key={user.uid}
                      href={`/profile/${user.uid}`}
                      className="flex items-center p-3 hover:bg-hover-mist"
                      onClick={onClose}
                    >
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={user.photoURL || '/images/default-avatar.png'}
                          alt={user.displayName || ''}
                          className="avatar"
                          fill
                          sizes="40px"
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-[14px] text-obsidian">
                          {user.displayName || 'Anonymous'}
                        </p>
                        <p className="text-[12px] text-felt-gray">{user.username || user.email}</p>
                      </div>
                    </Link>
                  ))}
                  {users.length === 0 && (
                    <p className="py-4 text-center text-felt-gray">No users found</p>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
