import { useRef, useCallback } from 'react';
import { Video } from 'expo-av';

interface VideoCache {
  [videoId: string]: {
    ref: Video | null;
    loaded: boolean;
    duration: number | null;
  };
}

export function useVideoCache() {
  const cache = useRef<VideoCache>({});

  const addToCache = useCallback((videoId: string, ref: Video | null) => {
    if (ref) {
      cache.current[videoId] = {
        ref,
        loaded: false,
        duration: null,
      };
    }
  }, []);

  const markAsLoaded = useCallback((videoId: string, duration?: number) => {
    if (cache.current[videoId]) {
      cache.current[videoId].loaded = true;
      if (duration) {
        cache.current[videoId].duration = duration;
      }
    }
  }, []);

  const getFromCache = useCallback((videoId: string) => {
    return cache.current[videoId];
  }, []);

  const clearCache = useCallback(() => {
    cache.current = {};
  }, []);

  const removeFromCache = useCallback((videoId: string) => {
    delete cache.current[videoId];
  }, []);

  return {
    addToCache,
    markAsLoaded,
    getFromCache,
    clearCache,
    removeFromCache,
  };
}