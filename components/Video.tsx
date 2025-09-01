import { apiService, ToctocVideo } from '@/services/api';
import { useEvent } from 'expo';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  Heart,
  MessageCircle,
  MoreVertical,
  Play,
  Share,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Button,
  Dimensions,
  TouchableOpacity,
  Text,
    Share as RNShare, 

  Alert,
} from 'react-native';


const { height, width } = Dimensions.get('window');
export default function VideoScreen({
  videoToc,
  videoRefs,
  index,
  currentIndex,
  showPlayButton,
  onTogglePlayPauseTocToc,
  onOpenComments,
  onHandleLike
}: {
  videoToc: ToctocVideo;
  videoRefs: any;
  index: number;
  currentIndex: number;
  showPlayButton: boolean;
  onTogglePlayPauseTocToc: () => void;
  onOpenComments: (id: string) => void;
  onHandleLike: (id: string) => void;
}) {
  const [showPlayButton2, setShowPlayButton2] = useState(false);

  const player = useVideoPlayer(videoToc.videoUrl, (player) => {
    player.loop = true;
    player.play();
    if (index === currentIndex) {
      setShowPlayButton2(false);
      player.play();
    } else {
      player.pause();
      setShowPlayButton2(true);
    }
  });
  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });
  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });

  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    console.log(`Video ${index}: showPlayButton=${showPlayButton} `);
  }, [showPlayButton, index]);

  useEffect(() => {
    if (index === currentIndex) {
      // This is the active video, play it
      if (!player.playing) {
        setShowPlayButton2(false);
        player.play();
      }
    } else {
      // This is not the active video, pause it
      if (player.playing) {
        player.pause();
        setShowPlayButton2(true);
      }
    }
  }, [currentIndex, index, player]);

  useEffect(() => {
    setShowControls(!isPlaying && index === currentIndex);

    console.log('Current times ', currentTime);
  }, [isPlaying, index, currentIndex]);

  const formatTime = (timeInSeconds: number) => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPauseTocToc = () => {
    // Only allow play/pause on the current video
    if (index !== currentIndex) return;

    if (player.playing) {
      player.pause();
      setShowPlayButton2(true);
    } else {
      setShowPlayButton2(false);

      player.play();
    }
  };

   const shareVideo = async () => {
    try {
      const result = await RNShare.share({
        message: 'Check out this video I found!',
        url: videoToc.videoUrl,
        title: 'Shared Video'
      });

      if (result.action === RNShare.sharedAction) {
        Alert.alert('Success action', RNShare.sharedAction);
        await apiService.shareVideo(videoToc.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share video link');
      console.error('Share error:', error);
    }
  };

  useFocusEffect(
  useCallback(() => {
    // quand l'écran est focus → rien à faire
    return () => {
      // quand on quitte l'écran → pause si le player existe
      if (player && typeof player.pause === "function") {
        try {
          player.pause();
        } catch (e) {
          console.log("Erreur lors de la pause du player :", e);
        }
      }
    };
  }, [player])
);


  return (
    <View style={styles.videoContainer}>
      <TouchableOpacity
        style={styles.videoTouchable}
        activeOpacity={1}
        onPress={togglePlayPauseTocToc}
      >
        {/* <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          nativeControls={false}
          playsInline={true}
          ref={(ref) => {
            videoRefs.current[videoToc.id] = ref;
          }}
        /> */}

         <Video
          ref={videoRefs.current[videoToc.id]}
          source={{ uri: videoToc.videoUrl }}
          style={styles.video}
          shouldPlay={isPlaying}
          isLooping
          resizeMode={ResizeMode.CONTAIN}
        />

        {/* Play button overlay */}
        {!isPlaying && index === currentIndex && showPlayButton2 && (
          <View style={styles.playButtonOverlay}>
            <View style={styles.playButton}>
              <Play
                onPress={togglePlayPauseTocToc}
                size={40}
                color="#fff"
                fill="#fff"
              />
            </View>
          </View>
        )}

        {/* Video Controls - Only show when paused */}
      </TouchableOpacity>

      <View style={styles.overlay}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradientOverlay}
        />

        <View style={styles.leftContent}>
          <Text style={styles.username}>@{videoToc.id}</Text>
          <Text style={styles.description} numberOfLines={3}>
            {videoToc.description}
          </Text>
        </View>

        <View style={styles.rightContent}>
          <TouchableOpacity style={styles.actionButton} 
          onPress={() => {
            onHandleLike(videoToc.id.toString());
          }}>
            <View
              style={[
                styles.iconContainer,
                videoToc.likedByCurrentUser && styles.likedIcon,
              ]}
            >
              <Heart
                size={28}
                color={videoToc.likedByCurrentUser ? '#fff' : '#fff'}
                fill={videoToc.likedByCurrentUser ? '#fff' : 'transparent'}
              />
            </View>
            <Text style={styles.actionText}>
               { videoToc.likeCount ?? 0 }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {          
              onOpenComments(videoToc.id.toString())
            }}
          >
            <View style={styles.iconContainer}>
              <MessageCircle size={28} color="#fff" />
            </View>
            <Text style={styles.actionText}>
               { videoToc.commentCount }
            </Text>
          </TouchableOpacity>


          <TouchableOpacity style={styles.actionButton}
            onPress={() => {  
                // Share video Link

               shareVideo()
            }}
          >
            <View style={styles.iconContainer}>
              <Share size={28} color="#fff" />
            </View>
            <Text style={styles.actionText}>
            { videoToc.shareCount }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.iconContainer}>
              <MoreVertical size={28} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 50,
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  controlsContainer: {
    padding: 10,
  },
  videoContainer: {
    height: height,
    width: width,
    position: 'relative',
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
  // Nouveaux styles pour les contrôles vidéo
  videoControls: {
    position: 'absolute',
    bottom: 80, // Au-dessus de l'overlay des boutons
    left: 20,
    right: 20,
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'center',
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginLeft: -6, // Pour centrer le thumb
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },

  // Styles existants à modifier si nécessaire
  // playButtonOverlay: {
  //   position: 'absolute',
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   bottom: 0,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   zIndex: 5,
  // },
  // playButton: {
  //   width: 80,
  //   height: 80,
  //   borderRadius: 40,
  //   backgroundColor: 'rgba(0, 0, 0, 0.5)',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
});
