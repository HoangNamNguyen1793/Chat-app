import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

interface UseSocketEventsProps {
  conversationId: string;
  onNewMessage?: (message: any) => void;
  onUserTyping?: (data: { user: string; isTyping: boolean }) => void;
  onMessageRead?: (data: {
    messageId: string;
    readBy: string;
    readAt: string;
    conversationId: string;
  }) => void;
  onMessagesReadBulk?: (data: {
    messageIds: string[];
    readBy: string;
    readAt: string;
    conversationId: string;
  }) => void;
}

export const useSocketEvents = ({
  conversationId,
  onNewMessage,
  onUserTyping,
  onMessageRead,
  onMessagesReadBulk,
}: UseSocketEventsProps) => {
  const { socket, isConnected, joinConversation, onlineUsers } = useSocket();
  const [isUserTyping, setIsUserTyping] = useState<{
    user: string;
    isTyping: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isConnected || !socket || !conversationId) return;

    joinConversation(conversationId);

    if (onNewMessage) {
      socket.on("new-message", (message: any) => {
        if (message.conversationId === conversationId) {
          onNewMessage(message);
        }
      });
    }

    if (onUserTyping) {
      socket.on("user-typing", (data: { user: string; isTyping: boolean }) => {
        setIsUserTyping(data);
        onUserTyping(data);
      });
    }

    if (onMessageRead) {
      socket.on(
        "message-read-update",
        (data: {
          messageId: string;
          readBy: string;
          readAt: string;
          conversationId: string;
        }) => {
          if (data.conversationId === conversationId) {
            onMessageRead(data);
          }
        }
      );
    }

    if (onMessagesReadBulk) {
      socket.on(
        "messages-read-bulk-update",
        (data: {
          messageIds: string[];
          readBy: string;
          readAt: string;
          conversationId: string;
        }) => {
          if (data.conversationId === conversationId) {
            onMessagesReadBulk(data);
          }
        }
      );
    }

    return () => {
      socket.off("new-message");
      socket.off("user-typing");
      socket.off("message-read-update");
      socket.off("messages-read-bulk-update");
    };
  }, [
    socket,
    isConnected,
    conversationId,
    onNewMessage,
    onUserTyping,
    onMessageRead,
    onMessagesReadBulk,
    joinConversation,
  ]);

  return {
    isUserTyping,
    onlineUsers,
  };
};
