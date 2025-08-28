import { ToctocVideo } from '@/services/api';
export interface CommentDTO {
    id: number;
    userId: number;
    parentId: number;
    content: string;
    createdAt: string;
    isLiked : false;
    likedByCurrentUser: boolean;
    userProfile: any;
}

export interface HLSVideoPlayerProps {
  uri: string;
  shouldPlay?: boolean;
  isLooping?: boolean;
  onError?: (error: any) => void;
  onLoad?: (status: any) => void;
}


export interface CommentRequestDTO {
  videoId: number;
  content: string;
}

export interface UserVideosResponseDTO {
  userId: number;
  videos: ToctocVideo[];
  totalVideos: number;
  message: string;
}
