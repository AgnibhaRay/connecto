'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import Image from 'next/image';
import type { Story } from '@/types';
import CreateStory from './CreateStory';

interface GroupedStories {
  [authorId: string]: {
    authorName: string;
    authorPhotoURL: string | undefined;
    stories: Story[];
  };
}

export default function StoriesContainer() {
  const [user] = useAuthState(auth);
  const [storiesByUser, setStoriesByUser] = useState<GroupedStories>({});
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const STORY_DURATION = 5000; // 5 seconds for images

  // Define handleStoryClick and handleNextStory with useCallback to avoid dependency issues
  const handleStoryClick = useCallback(async (authorId: string, index: number = 0) => {
    const userStories = storiesByUser[authorId]?.stories;
    if (!userStories) return;
    
    // Properly handle the video before switching stories
    if (videoRef.current) {
      try {
        // Pause the current video and reset its state
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch (error) {
        console.error('Error cleaning up video:', error);
      }
    }
    
    setCurrentStoryIndex(index);
    setSelectedStory(userStories[index]);
    setProgress(0);
    setIsPaused(false);
    
    // Mark story as viewed if not already viewed
    if (user && !userStories[index].viewedBy.includes(user?.uid || '')) {
      try {
        const storyRef = doc(db, 'stories', userStories[index].id);
        await updateDoc(storyRef, {
          viewedBy: [...userStories[index].viewedBy, user.uid]
        });
        // No need to update state manually - the onSnapshot listener will catch this change
      } catch (error) {
        console.error('Error updating story views:', error);
      }
    }
  }, [storiesByUser, user]);

  const handleNextStory = useCallback((authorId: string) => {
    const userStories = storiesByUser[authorId]?.stories;
    if (!userStories) return;
    
    if (currentStoryIndex < userStories.length - 1) {
      handleStoryClick(authorId, currentStoryIndex + 1);
    } else {
      setSelectedStory(null);
    }
  }, [storiesByUser, currentStoryIndex, handleStoryClick]);
  
  // Clear interval and unsubscribe when component unmounts
  useEffect(() => {
    // Store the current video element reference in a variable that will
    // be captured for the cleanup function
    const currentVideoRef = videoRef.current;
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      // Cleanup any video playback using the captured ref
      if (currentVideoRef) {
        currentVideoRef.pause();
        currentVideoRef.src = '';
        currentVideoRef.load();
      }
    };
  }, []);

  // Set up real-time listener for stories
  useEffect(() => {
    if (!user) return;

    // Keep previous stories while loading new ones
    setLoading(true);
    
    const now = new Date();
    const storyRef = collection(db, 'stories');
    const q = query(
      storyRef,
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'desc')
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedStories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Story[];

      console.log('Real-time stories update received:', fetchedStories.length);

      // Sort stories by creation time to ensure newest stories appear first
      fetchedStories.sort((a, b) => {
        // Handle Firestore timestamp objects
        let timeA: number;
        let timeB: number;
        
        if (a.createdAt instanceof Date) {
          timeA = a.createdAt.getTime();
        } else {
          // Handle Firestore timestamp
          const timestamp = a.createdAt as { seconds: number; nanoseconds: number };
          timeA = timestamp.seconds * 1000;
        }
        
        if (b.createdAt instanceof Date) {
          timeB = b.createdAt.getTime();
        } else {
          // Handle Firestore timestamp
          const timestamp = b.createdAt as { seconds: number; nanoseconds: number };
          timeB = timestamp.seconds * 1000;
        }
        
        return timeB - timeA;  // Newest first
      });

      // Group stories by author
      const grouped = fetchedStories.reduce((acc, story) => {
        if (!acc[story.authorId]) {
          acc[story.authorId] = {
            authorName: story.authorName,
            authorPhotoURL: story.authorPhotoURL,
            stories: []
          };
        }
        acc[story.authorId].stories.push(story);
        return acc;
      }, {} as GroupedStories);

      setStoriesByUser(grouped);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching stories:', error);
      setLoading(false);
    });

    unsubscribeRef.current = unsubscribe;
    
    return () => {
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    // When selected story changes, update UI and sync with current state
    if (selectedStory) {
      // Find the most up-to-date version of the story from state
      const currentAuthorStories = storiesByUser[selectedStory.authorId]?.stories || [];
      const updatedStory = currentAuthorStories.find(story => story.id === selectedStory.id);
      
      // If story exists and has been updated, sync the selectedStory with current data
      if (updatedStory && updatedStory !== selectedStory) {
        setSelectedStory(updatedStory);
      }
    }
  }, [storiesByUser, selectedStory]);

  // When a story is selected, start the progress bar
  useEffect(() => {
    if (selectedStory) {
      setProgress(0);
      setIsPaused(false);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      const startTime = Date.now();
      const authorId = selectedStory.authorId; // Capture the value
      
      // Capture video ref
      const currentVideoRef = videoRef.current;
      
      // Only set up timer for image stories
      // Videos will handle progress through the timeupdate event
      if (selectedStory.mediaType === 'image') {
        progressIntervalRef.current = setInterval(() => {
          if (!isPaused) {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);
            setProgress(newProgress);
            
            if (newProgress >= 100) {
              clearInterval(progressIntervalRef.current!);
              handleNextStory(authorId);
            }
          }
        }, 100);
      } else if (selectedStory.mediaType === 'video') {
        // Use a small timeout to ensure DOM is ready before trying to play
        // This helps avoid the "play() interrupted by pause()" error
        const playVideoTimer = setTimeout(() => {
          if (currentVideoRef) {
            currentVideoRef.currentTime = 0;
            
            // Only attempt to play if the component is still mounted and video is the current media
            const playPromise = currentVideoRef.play();
            
            if (playPromise !== undefined) {
              playPromise.catch(err => {
                console.error('Error auto-playing video:', err);
                // If autoplay fails due to browser policies, show the play button
                setIsPaused(true);
              });
            }
          }
        }, 50);
        
        return () => {
          clearTimeout(playVideoTimer);
        };
      }
      
      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        
        // Safely clean up video when component unmounts or story changes
        if (currentVideoRef && selectedStory?.mediaType === 'video') {
          try {
            currentVideoRef.pause();
          } catch (error) {
            console.error('Error pausing video during cleanup:', error);
          }
        }
      };
    }
  }, [selectedStory, handleNextStory, isPaused]);

  if (loading) {
    return (
      <div className="flex space-x-4 overflow-x-auto p-4 bg-white rounded-lg shadow mb-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="w-14 h-14 rounded-full bg-gray-200 animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex space-x-4 overflow-x-auto p-4 bg-white rounded-lg shadow mb-4">
        <CreateStory />
        
        {Object.entries(storiesByUser).map(([authorId, { authorName, authorPhotoURL, stories }]) => {
          const allStoriesViewed = stories.every(story => 
            story.viewedBy.includes(user?.uid || '')
          );

          return (
            <button
              key={authorId}
              onClick={() => handleStoryClick(authorId)}
              className="relative flex-shrink-0"
            >
              <div className={`w-14 h-14 rounded-full border-2 overflow-hidden relative ${
                allStoriesViewed ? 'border-gray-300' : 'border-indigo-500'
              }`}>
                <Image
                  src={authorPhotoURL || '/images/default-avatar.png'}
                  alt={authorName}
                  className="rounded-full object-cover w-full h-full"
                  fill
                  sizes="56px"
                  priority
                />
              </div>
              <p className="text-xs text-center mt-1 truncate max-w-[56px] font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                {authorId === user?.uid ? 'Your Story' : authorName}
              </p>
            </button>
          );
        })}
      </div>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button
            onClick={() => setSelectedStory(null)}
            className="absolute top-4 right-4 text-white text-2xl z-10"
          >
            ×
          </button>
          
          {/* Progress bar for both images and videos */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700">
            <div 
              className="h-full bg-white transition-all duration-100" 
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="w-full max-w-lg relative">
            {/* Story header with user info */}
            <div className="absolute top-4 left-4 flex items-center z-10">
              <div className="w-10 h-10 rounded-full overflow-hidden relative">
                <Image
                  src={selectedStory.authorPhotoURL || '/images/default-avatar.png'}
                  alt={selectedStory.authorName}
                  className="rounded-full object-cover"
                  fill
                  sizes="40px"
                />
              </div>
              <div className="ml-2 text-white">
                <p className="font-medium">{selectedStory.authorName}</p>
              </div>
            </div>
            
            {/* Left Arrow */}
            {currentStoryIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStoryClick(selectedStory.authorId, currentStoryIndex - 1);
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl z-10"
              >
                ‹
              </button>
            )}

            {/* Right Arrow */}
            {storiesByUser[selectedStory.authorId]?.stories.length - 1 > currentStoryIndex && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextStory(selectedStory.authorId);
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl z-10"
              >
                ›
              </button>
            )}

            {selectedStory.mediaType === 'video' ? (
              <div className="relative w-full">
                <video
                  ref={videoRef}
                  src={selectedStory.mediaURL}
                  autoPlay
                  playsInline
                  muted={false}
                  className={`w-full h-auto max-h-[90vh] ${
                    !selectedStory.orientation || selectedStory.orientation === 'portrait'
                      ? 'max-h-[90vh] w-auto'
                      : selectedStory.orientation === 'landscape'
                        ? 'w-full h-auto max-h-[90vh]'
                        : 'max-w-[90vh] max-h-[90vh]'
                  } object-contain`}
                  onEnded={() => handleNextStory(selectedStory.authorId)}
                  onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    if (video.duration) {
                      const percentage = (video.currentTime / video.duration) * 100;
                      setProgress(percentage);
                    }
                  }}
                  onClick={() => {
                    if (videoRef.current) {
                      // Check if a play operation is already in progress
                      const playPromise = videoRef.current.play();
                      
                      if (playPromise !== undefined) {
                        if (videoRef.current.paused) {
                          // If paused, try to play
                          playPromise
                            .then(() => {
                              setIsPaused(false);
                            })
                            .catch(error => {
                              console.error("Play failed:", error);
                              setIsPaused(true);
                            });
                        } else {
                          // If playing, wait for any pending play operation to complete before pausing
                          playPromise
                            .then(() => {
                              videoRef.current?.pause();
                              setIsPaused(true);
                            })
                            .catch(error => {
                              console.error("Error handling play/pause:", error);
                            });
                        }
                      } else {
                        // Fallback for browsers where playPromise is undefined
                        if (videoRef.current.paused) {
                          videoRef.current.play();
                          setIsPaused(false);
                        } else {
                          videoRef.current.pause();
                          setIsPaused(true);
                        }
                      }
                    }
                  }}
                />
                {/* This div prevents clicks from bubbling up to parent elements while allowing clicks on the video */}
                <div className="absolute inset-0 bg-transparent" onClick={(e) => e.stopPropagation()} />
                
                {/* Play/Pause indicator overlay */}
                {isPaused && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer" 
                    onClick={() => {
                      if (videoRef.current) {
                        const playPromise = videoRef.current.play();
                        
                        if (playPromise !== undefined) {
                          playPromise
                            .then(() => {
                              setIsPaused(false);
                            })
                            .catch(error => {
                              console.error("Play failed on overlay click:", error);
                            });
                        } else {
                          // Fallback
                          setIsPaused(false);
                        }
                      }
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Tap indicator when video is playing */}
                {!isPaused && (
                  <div className="absolute top-4 right-4 flex items-center space-x-2 text-white bg-black bg-opacity-40 px-2 py-1 rounded">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs font-medium">TAP TO PAUSE</span>
                  </div>
                )}
              </div>
            ) : (
              <div className={`flex items-center justify-center ${
                !selectedStory.orientation || selectedStory.orientation === 'portrait'
                  ? 'h-[90vh]'
                  : 'w-full'
              }`}>
                <Image
                  src={selectedStory.mediaURL}
                  alt={selectedStory.caption || 'Story'}
                  className={`${
                    !selectedStory.orientation || selectedStory.orientation === 'portrait'
                      ? 'max-h-[90vh] w-auto'
                      : selectedStory.orientation === 'landscape'
                        ? 'w-full h-auto max-h-[90vh]'
                        : 'max-w-[90vh] max-h-[90vh]'
                  } object-contain`}
                  width={1080}
                  height={1920}
                  priority
                />
              </div>
            )}
            
            {selectedStory.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                <p className="text-white text-center">{selectedStory.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
