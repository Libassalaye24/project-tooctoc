import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
  StatusBar,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Heart, MessageCircle, Share, MoveVertical as MoreVertical, Music, Play, Pause } from 'lucide-react-native';
import { mockUserVideos } from '@/data/mockData';
import CommentsModal from '@/components/CommentsModal';
import { ToctocVideo } from '@/services/api';

const { width, height } = Dimensions.get('window');

interface VideoDetails {
  id: string;
  uri: string;
  username: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  song: {
    title: string;
    artist: string;
    cover: string;
  };
}

export default function VideoDetailsScreen() {
  const { id, videoDataInfo } = useLocalSearchParams();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const videoRef = useRef<Video>(null);
  const spinValue = useRef(new Animated.Value(0)).current;
  const video: ToctocVideo = videoDataInfo ? JSON.parse(videoDataInfo as string) : null;
  
  // Mock video data - in real app, fetch from API using the id
  const videoData: VideoDetails = {
    id:  '1',
    uri: 'https://toctoc-minio.mydigitalpro.net/videos/videos/d626b8bf-fe60-4496-93a7-5b80935fdb6f.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20250901%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250901T094739Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=c15d280c49a367780ff13b7daf66c700e02754469a4d450648a9e50c85f138dc',
    username: 'john_doe',
    description: 'Amazing sunset view from my balcony! 🌅 #sunset #nature #peaceful #amazing #beautiful #view',
    likes: 1243,
    comments: 89,
    shares: 23,
    isLiked: false,
    song: {
      title: 'Chill Vibes',
      artist: 'Relaxing Sounds',
      cover: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=100',
    },
  };

  useEffect(() => {
    setIsLiked(videoData.isLiked);
    setLikes(videoData.likes);
    
    // Start song cover rotation animation
    const spin = () => {
      spinValue.setValue(0);
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    };
    
    if (isPlaying) {
      spin();
    }
  }, [isPlaying]);

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleOpenComments = () => {
    setCommentsVisible(true);
  };

  const handleAddComment = (text: string) => {
    const newComment = {
      id: Date.now().toString(),
      username: 'current_user',
      text,
      likes: 0,
      isLiked: false,
      timestamp: new Date().toISOString(),
    };
    setComments(prev => [newComment, ...prev]);
  };

  const handleLikeComment = (commentId: string) => {
    setComments(prev =>
      prev.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            }
          : comment
      )
    );
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatCount = (count: number) => {
    if (count > 999) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Video Player */}
      <TouchableOpacity style={styles.videoContainer} onPress={togglePlayPause} activeOpacity={1}>
        <Video
          ref={videoRef}
          source={{ uri: videoData.uri }}
          style={styles.video}
          shouldPlay={isPlaying}
          isLooping
          resizeMode={ResizeMode.COVER}
        />
        
        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Play size={50} color="#fff" fill="#fff" />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.overlay}
      >
        <View style={styles.content}>
          {/* Left Content */}
          <View style={styles.leftContent}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {videoData.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.username}>@{videoData.username}</Text>
            </View>
            
            <Text style={styles.description}>{videoData.description}</Text>
            
            {/* <View style={styles.songInfo}>
              <Music size={16} color="#fff" />
              <Text style={styles.songText}>
                {videoData.song.title} - {videoData.song.artist}
              </Text>
            </View> */}
          </View>

          {/* Right Actions */}
          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <View style={[styles.iconContainer, isLiked && styles.likedIcon]}>
                <Heart 
                  size={28} 
                  color="#fff" 
                  fill={isLiked ? '#fff' : 'transparent'}
                />
              </View>
              <Text style={styles.actionText}>{formatCount(likes)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleOpenComments}>
              <View style={styles.iconContainer}>
                <MessageCircle size={28} color="#fff" />
              </View>
              <Text style={styles.actionText}>{formatCount(videoData.comments)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.iconContainer}>
                <Share size={28} color="#fff" />
              </View>
              <Text style={styles.actionText}>{formatCount(videoData.shares)}</Text>
            </TouchableOpacity>
            
            {/* <TouchableOpacity style={styles.actionButton}>
              <Animated.View style={[styles.songCover, { transform: [{ rotate: spin }] }]}>
                <Image source={{ uri: videoData.song.cover }} style={styles.songCoverImage} />
              </Animated.View>
            </TouchableOpacity> */}
          </View>
        </View>
      </LinearGradient>

      {/* Comments Modal */}
      <CommentsModal
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        videoId={videoData.id}
        comments={comments}
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
    flex: 1,
  },
  video: {
    width: width,
    height: height,
  },
  playOverlay: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    padding: 20,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  moreButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 100,
    paddingTop: 100,
  },
  content: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  leftContent: {
    flex: 1,
    marginRight: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF0050',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 8,
    opacity: 0.8,
  },
  rightActions: {
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: 12,
    marginBottom: 5,
  },
  likedIcon: {
    backgroundColor: '#FF0050',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  songCover: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  songCoverImage: {
    width: '100%',
    height: '100%',
  },
});