import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Grid2x2 as Grid, Heart, MessageCircle, LogOut } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockUserVideos, mockVideosTest } from '@/data/mockData';
import { router } from 'expo-router';
import { apiService, ToctocVideo } from '@/services/api';

const { width } = Dimensions.get('window');
const videoWidth = width / 3 - 2;

export default function ProfileScreen() {
  const [userPhone, setUserPhone] = useState('');
  const [userVideos, setUserVideos] = useState(mockUserVideos);
  const [selectedTab, setSelectedTab] = useState<'videos' | 'liked'>('videos');
  const [videosTest, setVideosTest] = useState<ToctocVideo[]>(mockVideosTest);
  const [loading, setLoading] = useState<boolean>(true);

  
  useEffect(() => {
    loadUserData();
    // loadUserVideos();
  }, []);

  const loadUserData = async () => {
    try {
      const phone = await AsyncStorage.getItem('userPhone');
      if (phone) {
        setUserPhone(phone);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

   const loadUserVideos = async () => {
      setLoading(true);
      try {
        const response = await apiService.getMyVideos(1, 10);
          console.log("Response getMyVideos : ", response);
        if (response.success && response.data) {
          setVideosTest(response.data.videos);
        } else {
          throw new Error(response.message || 'Failed to load videos');
        }
      } catch (error) {
        console.error('Error loading trending videos:', error);
      } finally {
        setLoading(false);
      }
    };

  const handleLogout = () => {
    // Alert.alert(
    //   'Déconnexion',
    //   'Êtes-vous sûr de vouloir vous déconnecter ?',
    //   [
    //     {
    //       text: 'Annuler',
    //       style: 'cancel',
    //     },
    //     {
    //       text: 'Déconnexion',
    //       style: 'destructive',
    //       onPress: async () => {
    //         try {
    //           await AsyncStorage.multiRemove(['userToken', 'userPhone']);
    //           // Restart the app to show auth screen
    //           router.replace('/');
    //         } catch (error) {
    //           console.error('Error during logout:', error);
    //         }
    //       },
    //     },
    //   ]
    // );
    AsyncStorage.multiRemove(['userToken', 'userPhone', 'tokenToctoc']).then();          
    router.replace('/');
  };

  const renderVideoItem = ({ item }: { item: ToctocVideo }) => (
    <TouchableOpacity style={styles.videoItem}>
      <Image source={{ uri: item.thumbnailUrl }} style={styles.videoThumbnail} />
      <View style={styles.videoOverlay}>
        <Text style={styles.videoViews}>{item.id}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (selectedTab === 'videos') {
      return (
        <FlatList
          data={videosTest}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.videoGrid}
        />
      );
    } else {
      return (
        <View style={styles.emptyState}>
          <Heart size={50} color="#666" />
          <Text style={styles.emptyText}>No liked videos yet</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF0050', '#00F2EA']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.settingsButton} onPress={handleLogout}>
          <LogOut size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userPhone.slice(-2) || 'ME'}
            </Text>
          </View>
          <Text style={styles.username}>@{userPhone || 'user'}</Text>
          <Text style={styles.phone}>{userPhone}</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1.2K</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>15.3K</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'videos' && styles.activeTab]}
          onPress={() => setSelectedTab('videos')}
        >
          <Grid size={20} color={selectedTab === 'videos' ? '#FF0050' : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'videos' && styles.activeTabText]}>
            Videos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'liked' && styles.activeTab]}
          onPress={() => setSelectedTab('liked')}
        >
          <Heart size={20} color={selectedTab === 'liked' ? '#FF0050' : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'liked' && styles.activeTabText]}>
            Liked
          </Text>
        </TouchableOpacity>
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  phone: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#111',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF0050',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 8,
  },
  activeTabText: {
    color: '#FF0050',
  },
  videoGrid: {
    padding: 1,
  },
  videoItem: {
    width: videoWidth,
    height: videoWidth * 1.5,
    margin: 1,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 5,
    left: 5,
  },
  videoViews: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
});