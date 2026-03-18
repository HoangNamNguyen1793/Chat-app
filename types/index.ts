import { User } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

export interface Conversation {
  users: string[];
  isGroup?: boolean | null;
  groupName?: string | null;
  groupDescription?: string | null;
  groupImage?: string | null;
  adminUsers?: string[] | null;
  createdAt?: string | null;
  createdBy?: string | null;
  lastActivity?: string | null;
}

export interface GroupMember {
  email: string;
  displayName: string;
  photoURL?: string;
  isAdmin: boolean;
  joinedAt: Timestamp;
  addedBy?: string | null;
}

export interface AppUser {
  email: string;
  lastSeen: Timestamp;
  photoURL: string;
  displayName: string;
  password: string;
}

export interface IMessage {
  id: string;
  conversation_id: string;
  text: string;
  sent_at: string;
  user: string;
  fileUrl?: string;
  conversationId?: string;
  isRead?: boolean;
  readAt?: string;
  readBy?: string[];
  isDeleted?: boolean;
  deletedAt?: string;
  isSystemMessage?: boolean;
}

export interface TypingStatus {
  user: string;
  isTyping: boolean;
  conversationId: string;
}

export interface SocketMessageData extends IMessage {
  conversationId: string;
}

export interface ReadReceiptData {
  messageId: string;
  conversationId: string;
  readBy: string;
  readAt: string;
}
