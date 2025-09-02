import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Send, Heart } from 'lucide-react-native';
import { CommentDTO, CommentRequestDTO } from '@/models/app.interfaces';
import { apiService } from '@/services/api';
import SkeletonLoading from 'expo-skeleton-loading'

const { height } = Dimensions.get('window');

interface Comment {
  id: string;
  username: string;
  text: string;
  likes: number;
  isLiked: boolean;
  timestamp: string;
}

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  videoId: string;
  comments: Comment[];
  onAddComment: (text: string) => void;
  onLikeComment: (commentId: string) => void;
}

export default function CommentsModal({
  visible,
  onClose,
  videoId,
  comments,
  onAddComment,
  onLikeComment,
}: CommentsModalProps) {
  const [newComment, setNewComment] = useState('');
   const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
   const [commentsData, setCommentData] = useState<CommentDTO[]>([]);

  useEffect(() => {
    if (visible) {
      // setTimeout(() => {
      //   inputRef.current?.focus();
      // }, 300);
    }
  }, [visible]);

  const handleSendComment = async () => {
    if (newComment.trim()) {
      await saveCommentVideoId(videoId, newComment.trim())
      .finally(() => {
        setNewComment('');
      })
    }
  };

  const likeComment = (commentId: number) => {
      setCommentData(prev =>
        prev.map((comment: any) =>
          comment.id === commentId
            ? {
                ...comment,
                likedByCurrentUser: !comment.likedByCurrentUser
              }
            : comment
        )
      );
  };



  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - commentTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const renderComment = ({ item }: { item: CommentDTO }) => (
    <View style={styles.commentItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
         a
        </Text>
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.username}>
            {item.userProfile?.firstName ?? 'user'}
          </Text>
          <Text style={styles.timestamp}>{formatTimestamp(item.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
      <TouchableOpacity
        style={styles.likeButton}
      
        onPress={
          () => {
             likeComment(item.id);
             handleLikeComment(item.id.toString(), false)
          }
      }
      >
        <Heart
          size={18}
          color={item.likedByCurrentUser ? '#FF0050' : '#666'}
          fill={item.likedByCurrentUser ? '#FF0050' : 'transparent'}
        />
        {/* {item.likes > 0 && (
          <Text style={[styles.likeCount, item.isLiked && styles.likedCount]}>
            {item.likes}
          </Text>
        )} */}
      </TouchableOpacity>
    </View>
  );


  const renderSkeletonLoader = () => (
    <SkeletonLoading background={"#adadad"} highlight={"#ffffff"}>
      <View style={{ flexDirection: "column", padding: 10 }}>
        {[...Array(5)].map((_, index) => (
          <View
            key={index}
            style={{
              marginBottom: 20,
              backgroundColor: "#e0e0e0",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
  
            {/* Ligne avatar + pseudo */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 10
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#adadad",
                  marginRight: 10,
                }}
              />
            </View>
          </View>
        ))}
      </View>
    </SkeletonLoading>
  );
   const loadCOmmentsByVideoId = async (videoId: string) => {
      try {
        const response = await apiService.getVideoComments(Number(videoId));
        
        if (response.success && response.data) {
         console.log("setCommentData ", response.data)
          setCommentData(response.data)
        } 
      }catch {
        console.error('Error loading like count');
      }
  };

    const handleLikeComment = async (commentId: string, reloading: boolean = true) => {
      console.log("handleLikeComment ", commentId);
      try {
        const resp = await apiService.likeComment(Number(commentId));
        console.log("Response like commenrt ", resp)
        // likeComment(Number(commentId));
        if (reloading) {
          await loadCOmmentsByVideoId(videoId);
        }
      } catch (error) {
        console.error("Une erreur est survenue ", error)
        Alert.alert("Erreur ")
      }
    };

  const saveCommentVideoId = async (videoId: string, content: string) => {
      try {
        const request: CommentRequestDTO = {
          videoId: Number(videoId),
          content: content,
        } as CommentRequestDTO;
        const response = await apiService.addComment(request);
        
        if (response.success && response.data) {

          onAddComment(videoId)
          loadCOmmentsByVideoId(videoId);
        } 
      }catch {
        console.error('Error loading like count');
      }
  };


  useEffect(() => {
    setCommentData([])
     if (videoId) {
       loadCOmmentsByVideoId(videoId);
     }
  }, [videoId]);

  useEffect(() => {
    setCommentData(commentsData);
  }, [commentsData]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#FF0050', '#00F2EA']}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>
              {commentsData.length} comment{commentsData.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {isLoading ? (
  renderSkeletonLoader()
) : (
  <FlatList
    data={commentsData}
    renderItem={renderComment}
    keyExtractor={(item) => item.id.toString()}
    style={styles.commentsList}
    showsVerticalScrollIndicator={true}
    contentContainerStyle={styles.commentsContent}
    ListEmptyComponent={
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No comments yet</Text>
        <Text style={styles.emptySubtext}>Be the first to comment!</Text>
      </View>
    }
  />
)}


          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.inputContainer}
          >
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder="Add a comment..."
                placeholderTextColor="#666"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={200}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  newComment.trim() ? styles.sendButtonActive : styles.sendButtonInactive
                ]}
                onPress={handleSendComment}
                disabled={!newComment.trim()}
              >
                <Send size={20} color={newComment.trim() ? '#fff' : '#666'} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#000',
    height: height * 0.7,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  commentsList: {
    flex: 1,
    backgroundColor: '#111',
  },
  commentsContent: {
    paddingVertical: 10,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF0050',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
  },
  commentText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
  },
  likeButton: {
    alignItems: 'center',
    paddingLeft: 10,
    paddingTop: 5,
  },
  likeCount: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  likedCount: {
    color: '#FF0050',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
  },
  inputContainer: {
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingBottom: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    maxHeight: 80,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#FF0050',
  },
  sendButtonInactive: {
    backgroundColor: '#333',
  },
});