import { CommentDTO, CommentRequestDTO, UserVideosResponseDTO } from "@/models/app.interfaces";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = 'https://backend-toctoc.mydigitalpro.net/api';
// const API_BASE_URL = 'http://localhost:8080/api';

export interface ToctocVideo {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  hlsPlaylistUrl: string;
  thumbnailUrl: string;
  duration: number;
  isPremium: boolean;
  price: number | null;
  createdAt: string; // ISO date string
  userId: number;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'; // Adjust as needed
  relevanceScore: number;
  tags: any;
  hashtags: any;
  likedByCurrentUser: boolean;
  isFollowingCreator: boolean | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  userPseudo: string;
  userProfilePictureUrl: string | null;
  userIsCertified: boolean | null;
}


export interface User {
  id: string;
  phone: string;
  username: string;
  avatar?: string;
  followersCount: number;
  followingCount: number;
  likesCount: number;
}

export interface Video {
  id: string;
  uri: string;
  thumbnail?: string;
  username: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: string;
  userId: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface MobileAuthResponse {
  hasAccount: boolean;
  idToken: string;
  refreshToken: string;
  tokenType: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profilePictureUrl: string | null;
  socialId: string | null;
  user: {
    id: string;
    login: string;
    firstName: string;
    lastName: string;
    email: string;
  }
}


export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Comment {
  id: string;
  username: string;
  text: string;
  likes: number;
  isLiked: boolean;
  timestamp: string;
  userId: string;
  videoId: string;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    AsyncStorage.setItem("tokenToctoc", token);
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem("tokenToctoc");
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      let headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
 
       const token = await this.getToken();
      if (token) {        
        // Create a new Headers object to avoid typing issues
        const headersObj = new Headers(headers);
        headersObj.set('Authorization', `Bearer ${token}`);
        headers = headersObj;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });


      console.log("Response api fecth ", response);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'An error occurred',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication
  async sendOTP(phone: string): Promise<ApiResponse<{message: string}>> {
    return this.request(`/mobile/auth/request-otp`,{
      method: 'POST',
      body: JSON.stringify({ phoneNumber: phone }),
    });
  }

  async verifyOTP(phone: string, otp: string): Promise<AuthResponse> {
    const response: ApiResponse<MobileAuthResponse> = await this.request('/mobile/auth/login',{
      method: 'POST',
      body: JSON.stringify(
        {
          authProvider: "PHONE",
          phoneNumber: phone,
          otpCode: "123456",
          deviceInfo: "Postman Testing"
        }
      ),
    });

    if (response.success && response.data) {
      this.setToken(response.data?.idToken);
      return {
        success: true,
        token: response.data.idToken,
        user: {
          id: response.data.user.id ?? "0",
          username: response.data?.user.firstName.concat(response.data?.user.lastName),
          followersCount: 0,
          followingCount: 0,
          likesCount: 0
        } as User,
      };
    }

    return {
      success: false,
      message: response.error || 'Verification failed',
    };
  }

  async logout(): Promise<ApiResponse<unknown>> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });
    
    this.token = null;
    AsyncStorage.removeItem("tokenToctoc");
    AsyncStorage.removeItem("userToken");
    AsyncStorage.removeItem("userPhone");
    return response;
  }

  // Videos
  async getVideos(page: number = 1, limit: number = 10): Promise<ApiResponse<ToctocVideo[]>> {
    return this.request(`/recommendations/trending?limit=${limit}`);
  }


  async getMyVideos(page: number = 1, limit: number = 10): Promise<ApiResponse<UserVideosResponseDTO>> {
    return this.request(`/recommendations/my-videos`);
  }


  async getLikeCount(videoId: number): Promise<ApiResponse<{ count : number}>> {
    return this.request(`/interactions/like/video/${videoId}/count`);
  }

  async getCommentCount(videoId: number): Promise<ApiResponse<any>> {
    return this.request(`/interactions/comment/video/${videoId}/count`);
  }

  async getShareCount(videoId: number): Promise<ApiResponse<{ count : number}>> {
    return this.request(`/interactions/share/video/${videoId}/count`);
  }

  async getUserVideos(userId: string): Promise<ApiResponse<Video[]>> {
    return this.request(`/users/${userId}/videos`);
  }

  async uploadVideo(videoUri: string, description: string): Promise<ApiResponse<Video>> {
    const formData = new FormData();
    formData.append('video', {
      uri: videoUri,
      type: 'video/mp4',
      name: 'video.mp4',
    } as any);
    formData.append('description', description);

    return this.request('/videos/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }

  async likeVideo(videoId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/interactions/like/video/${videoId}`);
  }

  async unlikeVideo(videoId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
    return this.request(`/videos/${videoId}/unlike`, {
      method: 'DELETE',
    });
  }

  // Comments
  async getVideoComments(videoId: number): Promise<ApiResponse<CommentDTO[]>> {
    return this.request(`/comments/${videoId}`);
  }

  async addComment(request: CommentRequestDTO): Promise<ApiResponse<CommentDTO>> {
    return this.request(`/comments`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async likeComment(commentId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/interactions/like/comment/${commentId}`);
  }

  async unlikeComment(commentId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
    return this.request(`/comments/${commentId}/unlike`, {
      method: 'DELETE',
    });
  }

  
  async shareVideo(videoId: number, plateform: string = "WHATSAPP"): Promise<ApiResponse<any>> {
    return this.request(`/interactions/share/create`, {
      body: JSON.stringify({
        videoId: videoId,
        plateform: plateform
      }),
      method: 'POST'
    });
  }
  // User
  async getUserProfile(userId: string): Promise<ApiResponse<User>> {
    return this.request(`/users/${userId}`);
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }


  getCurrentUser() {
    
  }
}

export const apiService = new ApiService();