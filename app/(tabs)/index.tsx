import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions, FlatList, Text, TouchableOpacity, Image, Animated, ActivityIndicator, Alert } from 'react-native';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, Share, MoveVertical as MoreVertical, Play, Pause, Music } from 'lucide-react-native';
import { mockVideos, mockVideosTest } from '@/data/mockData';
import CommentsModal from '@/components/CommentsModal';
import { apiService, ToctocVideo } from '@/services/api';
import VideoScreen from '@/components/Video';


const { height, width } = Dimensions.get('window');

interface VideoItem {
  id: string;
  uri: string;
  username: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  song?: {
    title: string;
    artist: string;
    cover: string;
    audioUrl: string;
  };
}
interface VideoEngagement {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByCurrentUser: boolean;
  loading: boolean;
}

interface Comment {
  id: string;
  username: string;
  text: string;
  likes: number;
  isLiked: boolean;
  timestamp: string;
}

export default function HomeScreen() {
  const [videos, setVideos] = useState<VideoItem[]>(mockVideos);
    const [videosTest, setVideosTest] = useState<ToctocVideo[]>(mockVideosTest);
      const [loading, setLoading] = useState<boolean>(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [comments, setComments] = useState<{ [videoId: string]: Comment[] }>({
    '1': [
      {
        id: '1',
        username: 'alice_wonder',
        text: 'Amazing sunset! 😍',
        likes: 12,
        isLiked: false,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        username: 'bob_photographer',
        text: 'The colors are incredible! What camera did you use?',
        likes: 8,
        isLiked: true,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
    ],
    '2': [
      {
        id: '3',
        username: 'dance_lover',
        text: 'Love the moves! 💃',
        likes: 25,
        isLiked: false,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ],
  });
  const spinValue = useRef(new Animated.Value(0)).current;

   const [likeCounts, setLikeCounts] = useState<{ [videoId: string]: number }>({});
  const [shareCounts, setShareCounts] = useState<{ [videoId: string]: number }>({});


  // Animation for song cover rotation
  React.useEffect(() => {
    const spin = () => {
      spinValue.setValue(0);
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      ).start();
    };

    if (isPlaying) {
      spin();
    }
  }, [isPlaying, currentIndex]);

  const spinInterpolate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const flatListRef = useRef<FlatList>(null);
  // const currentVideo = videoRefs.current[videosTest[currentIndex]?.id!];

  const handleLike = async (id: string) => {

    
     setVideosTest(videosTest.map(video => 
      video.id === Number(id) 
        ? { ...video, likedByCurrentUser: !video.likedByCurrentUser }
        : video
    ));

    setVideosTest(videosTest.map(video => 
      video.id === Number(id) 
        ? { ...video,likeCount: video.likedByCurrentUser ? video.likeCount - 1 : video.likeCount + 1 }
        : video
    ));

    try {
      const response = await apiService.likeVideo(Number(id));
      if (response.success && response.data) {
        console.log("Response data from like event {}", response.data)
      
      } else {
        throw new Error(response.message || 'Failed to like videos');
      }
    } catch (error) {
      console.error('Error to like videos:', error);
    }
  };

  const handleOpenComments = async (videoId: string) => {
        const currentVideo = videoRefs.current[videosTest[currentIndex]?.id!];

    if (isPlaying && currentVideo) {
        await currentVideo.pauseAsync();
        setIsPlaying(false);
        setShowPlayButton(false);
      }
    setSelectedVideoId(videoId);
    setCommentsVisible(true);
  };

  
  const loadTrendingVideos = async () => {
    setLoading(true);
    try {
      const response = await apiService.getVideos(1, 10);
      
      if (response.success && response.data) {
        console.log("Response video ", response.data)
        setVideosTest(response.data);
      
      } else {
        throw new Error(response.message || 'Failed to load videos');
      }
    } catch (error) {
      console.error('Error loading trending videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const useVideoEngagement = (videoId: number) => {
    const [engagement, setEngagement] = useState<VideoEngagement>({
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      likedByCurrentUser: false,
      loading: true,
    });
    const loadEngagementData = useCallback(async () => {
    try {
      setEngagement(prev => ({ ...prev, loading: true }));
      
      const [likeCount, commentCount] = await Promise.all([
        loadLikeCount(videoId),
        // loadCommentCount(videoId),
        loadShareCount(videoId),
      ]);

      setEngagement(prev => ({
        ...prev,
        likeCount,
        commentCount,
        loading: false,
      }));
    } catch (error) {
      console.error('Error loading engagement data:', error);
      setEngagement(prev => ({ ...prev, loading: false }));
    }
  }, [videoId]);

  // Handle like action
  // const handleLike = useCallback(async () => {
  //   try {
  //     const response = await apiService.toggleLike(videoId);
      
  //     if (response.success && response.data) {
  //       setEngagement(prev => ({
  //         ...prev,
  //         likedByCurrentUser: response.data!.liked,
  //         likeCount: response.data!.count,
  //       }));
  //     }
  //   } catch (error) {
  //     console.error('Error handling like:', error);
  //   }
  // }, [videoId]);

  // Handle share action
  // const handleShare = useCallback(async () => {
  //   try {
  //     const response = await apiService.recordShare(videoId);
      
  //     if (response.success && response.data) {
  //       setEngagement(prev => ({
  //         ...prev,
  //         shareCount: response.data!.count,
  //       }));
  //     }
  //   } catch (error) {
  //     console.error('Error handling share:', error);
  //   }
  // }, [videoId]);

  // Load data on mount
  useEffect(() => {
    loadEngagementData();
  }, [loadEngagementData]);

  return {
    ...engagement,
    refresh: loadEngagementData,
  };
};


  const loadLikeCount = async (videoId: number) => {
    try {
      const response = await apiService.getLikeCount(videoId);
      
      if (response.success && response.data) {
        return response.data.count;
      } 
      return 0;
    }catch {
      console.error('Error loading like count');
       return 0;
    }
  }

  const loadShareCount = async (videoId: number) => {
    try {
      const response = await apiService.getShareCount(videoId);
      
      if (response.success && response.data) {
        return response.data.count;
      } 
      return 0;
    }catch {
      console.error('Error loading share count');
       return 0;
    }
  }
  

  const handleAddComment = (text: string) => {

  };

  const handleLikeComment = async (commentId: string) => {
    console.log("handleLikeComment ", commentId);

    try {
      const resp = await apiService.likeComment(Number(commentId));
      console.log("Response like commenrt ", resp)
    } catch (error) {
      console.error("Une erreur est survenue ", error)
      Alert.alert("Erreur ")
    }
  };

  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const handleFirstInteraction = () => {
  if (!hasUserInteracted) {
    setHasUserInteracted(true);
  }
};

 const getVideoSource = (item: ToctocVideo) => {
    // 1. Essayer avec des headers personnalisés pour HLS
    if (item.videoUrl.includes('.m3u8')) {
      return {
        uri: item.videoUrl,
        headers: {
          'Accept': 'application/vnd.apple.mpegurl, application/x-mpegURL, video/mp2t, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; HLS-Player)',
        }
      };
    }
    
    // 2. Fallback pour MP4 ou autres formats
    return { uri: item.videoUrl };
  };
   
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index || 0;
      setCurrentIndex(newIndex);
      setIsPlaying(true);
      setShowPlayButton(false);
      
      
      // Pause all videos except the current one
      // Object.keys(videoRefs.current).forEach((key, index) => {
      //   const video = videoRefs.current[key];
      //   if (video) {
      //     if (index === newIndex) {
      //       video.playAsync();
      //     } else {
      //       video.pauseAsync();
      //     }
      //   }
      // });
    }
  }, []);

  //    useEffect(() => {
  //       const loadCounts = async () => {
  //         const likeCountsData: { [videoId: string]: number } = {};
  //         const shareCountsData: { [videoId: string]: number } = {};
          
  //         for (const video of videos) {
  //           const videoIdNum = parseInt(video.id);
  //           const likeCount = await loadLikeCount(videoIdNum);
  //           const shareCount = await loadShareCount(videoIdNum);
            
  //           likeCountsData[video.id] = likeCount;
  //           shareCountsData[video.id] = shareCount;
  //         }
          
  //         setLikeCounts(likeCountsData);
  //         setShareCounts(shareCountsData);
  //       };
    
  //   loadCounts();
  //    console.log("likesCount ", likeCounts);
  //      console.log("shareCount ", shareCounts);

  // }, [videosTest]);

  const togglePlayPause = async () => {
    const currentVideo = videoRefs.current[videos[currentIndex].id];
    if (currentVideo) {
      if (isPlaying) {
        await currentVideo.pauseAsync();
        setIsPlaying(false);
        setShowPlayButton(true);
      } else {
        await currentVideo.playAsync();
        setIsPlaying(true);
        setShowPlayButton(false);
      }
    }
  };

  const togglePlayPauseTocToc = async () => {
    const currentVideo = videoRefs.current[videosTest[currentIndex].id];
    if (currentVideo) {
      if (isPlaying) {
        await currentVideo.pauseAsync();
        setIsPlaying(false);
        setShowPlayButton(true);
      } else {
        await currentVideo.playAsync();
        setIsPlaying(true);
        setShowPlayButton(false);
      }
    }
  };

  // Hide play button after 2 seconds
  React.useEffect(() => {
     loadTrendingVideos();
    if (showPlayButton) {
      const timer = setTimeout(() => {
        setShowPlayButton(false);
        
      }, 2000);
      return () => clearTimeout(timer);
    }

    
  }, [showPlayButton]);
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300,
  };

  const getItemLayout = (data: any, index: number) => ({
    length: height,
    offset: height * index,
    index,
  });


  const handleOpenCommentsV2 = (videoId: string): void => {
    setSelectedVideoId(videoId);
    setCommentsVisible(true);
  };

   const renderTocotocVideoItem = ({ item, index }: { item: ToctocVideo; index: number }) => (
    
//     <View style={styles.videoContainer}>
//       <TouchableOpacity 
//         style={styles.videoTouchable} 
//         activeOpacity={1}
//         onPress={togglePlayPauseTocToc}
//       >
//       <Video
//         ref={(ref) => { videoRefs.current[item.id] = ref; }}
//         style={styles.video}
//                   source={
//                     { 
//                       uri: item.videoUrl,  
//                        headers: {
//                           'Accept': 'application/vnd.apple.mpegurl, application/x-mpegURL, video/mp2t, */*',
//                           'User-Agent': 'Mozilla/5.0 (compatible; HLS-Player)',
//                       }
//                     }
//                   }
//        shouldPlay={hasUserInteracted && index === currentIndex && isPlaying}
//         isLooping
//         resizeMode={ResizeMode.COVER}
//         useNativeControls={false}
//         progressUpdateIntervalMillis={5000}
//         onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
//           if (status.isLoaded) {
//             // console.log('HLS Status:', status);
//             // Vérifier si la durée est disponible
//             togglePlayPauseTocToc()
//             if (status.durationMillis && !isNaN(status.durationMillis)) {
//               console.log('Duration:', status.durationMillis);
//             }
//           }
//         }}
//         onError={(error: any) => {
//           console.error('Erreur lecture HLS:', error);
//         }}
//         onLoad={(status: AVPlaybackStatus) => {
//           console.log('Video chargée ');
//         }}
        
//       />
        
//         {/* Play button overlay */}
//         {!isPlaying && index === currentIndex && showPlayButton && (
//           <View style={styles.playButtonOverlay}>
//             <View style={styles.playButton}>
//               <Play size={40} color="#fff" fill="#fff" />
//             </View>
//           </View>
//         )}
//       </TouchableOpacity>
      
//       <View style={styles.overlay}>
//         <LinearGradient
//           colors={['transparent', 'rgba(0,0,0,0.8)']}
//           style={styles.gradientOverlay}
//         />
        
//         <View style={styles.leftContent}>
//           <Text style={styles.username}>@{item.id}</Text>
//           <Text style={styles.description} numberOfLines={3}>
//             {item.description}
//           </Text>
//         </View>
        
//         <View style={styles.rightContent}>
//           <TouchableOpacity
//             style={styles.actionButton}
//             onPress={() => handleLike(item.id.toString())}
//           >
//             <View style={[styles.iconContainer, item.likedByCurrentUser && styles.likedIcon]}>
//               <Heart 
//                 size={28} 
//                 color={item.likedByCurrentUser ? '#fff' : '#fff'} 
//                 fill={item.likedByCurrentUser ? '#fff' : 'transparent'}
//               />
//             </View>
//             <Text style={styles.actionText}>
//               {/* {item.likeCount > 999 ? `${(item.likeCount / 1000).toFixed(1)}K` : item.likeCount} */}
//               { likeCounts[item.id] ?? 0 }
//                 {/* {(likeCounts[item.id] || item.likeCount) > 999 ? `${((likeCounts[item.id] || item.likeCount) / 1000).toFixed(1)}K` : (likeCounts[item.id] || item.likeCount)} */}
//             </Text>
//             {/* <MyComponent 
//   item={item} 
//   loadLikeCount={loadLikeCount} 
//   style={styles.actionText} 
// /> */}
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={styles.actionButton}
//             onPress={() => handleOpenComments(item.id.toString())}
//           >
//             <View style={styles.iconContainer}>
//               <MessageCircle size={28} color="#fff" />
//             </View>
//             <Text style={styles.actionText}>
//               {item.commentCount && item.commentCount > 999 ? `${(item.commentCount / 1000).toFixed(1)}K` : item.commentCount}
//             </Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity style={styles.actionButton}>
//             <View style={styles.iconContainer}>
//               <Share size={28} color="#fff" />
//             </View>
//             <Text style={styles.actionText}>
//               {item.shareCount && item.shareCount > 999 ? `${(item.shareCount / 1000).toFixed(1)}K` : item.shareCount}
//             </Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity style={styles.actionButton}>
//             <View style={styles.iconContainer}>
//               <MoreVertical size={28} color="#fff" />
//             </View>
//           </TouchableOpacity>
//         </View>
        
//         {/* Song info */}
//         {/* {item.song && (
//           <View style={styles.songInfo}>
//             <View style={styles.songDetails}>
//               <Music size={16} color="#fff" />
//               <Text style={styles.songText} numberOfLines={1}>
//                 {item.song.title} - {item.song.artist}
//               </Text>
//             </View>
//             <Animated.View 
//               style={[
//                 styles.songCover,
//                 { transform: [{ rotate: index === currentIndex && isPlaying ? spinInterpolate : '0deg' }] }
//               ]}
//             >
//               <Image source={{ uri: item.song.cover }} style={styles.songCoverImage} />
//             </Animated.View>
//           </View>
//         )} */}
//       </View>
//     </View>
 <VideoScreen 
  videoToc={item} videoRefs={videoRefs}
   index={index} currentIndex={currentIndex} 
   showPlayButton={showPlayButton} 
   onTogglePlayPauseTocToc={togglePlayPause}
   onOpenComments={handleOpenCommentsV2}
   onHandleLike={handleLike}
     />

/* <VideoScreen  videoSource={item.hlsPlaylistUrl}  /> */

  );
   if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={videosTest}
        renderItem={renderTocotocVideoItem}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
      />
      
      <CommentsModal
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        videoId={selectedVideoId}
        comments={comments[selectedVideoId] || []}
        onAddComment={handleAddComment}
        onLikeComment={handleLikeComment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    height: height,
    width: width,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  videoTouchable: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
  },
  leftContent: {
    position: 'absolute',
    bottom: 100,
    left: 15,
    right: 80,
    maxWidth: width * 0.7,
  },
  rightContent: {
    position: 'absolute',
    bottom: 100,
    right: 15,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bottomContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 25,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  likedIcon: {
    backgroundColor: '#FF0050',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  songInfo: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  songDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  songText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },
  songCover: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  songCoverImage: {
    width: '100%',
    height: '100%',
  },
});