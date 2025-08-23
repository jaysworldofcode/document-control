export interface ChatMessage {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl?: string;
  userAvatarThumbnailUrl?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  messageType: 'text' | 'file' | 'system';
  attachments?: ChatAttachment[];
  reactions?: ChatReaction[];
  replyTo?: string; // ID of message being replied to
}

export interface ChatAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
}

export interface ChatReaction {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  userAvatarThumbnailUrl?: string;
  type: 'like' | 'love' | 'laugh' | 'angry' | 'sad';
  createdAt: string;
}

export interface ProjectChat {
  id: string;
  projectId: string;
  projectName: string;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isActive: boolean;
}

export interface ChatParticipant {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl?: string;
  userAvatarThumbnailUrl?: string;
  isOnline: boolean;
  lastSeen: string;
  role: 'manager' | 'member' | 'viewer';
}

export interface NewChatMessage {
  content: string;
  attachments?: File[];
  replyTo?: string;
}

export interface ChatSettings {
  isMinimized: boolean;
  isVisible: boolean;
  notifications: boolean;
  soundEnabled: boolean;
}

// New interface for user avatar data
export interface UserAvatar {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  avatarThumbnailUrl?: string;
  initials: string;
}
