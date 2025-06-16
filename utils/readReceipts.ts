import {
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export const markMessageAsReadInDB = async (
  messageId: string,
  userEmail: string
) => {
  try {
    const messageRef = doc(db, "messages", messageId);
    const messageDoc = await getDoc(messageRef);

    if (messageDoc.exists()) {
      const currentReadBy = messageDoc.data().readBy || [];

      if (!currentReadBy.includes(userEmail)) {
        await updateDoc(messageRef, {
          isRead: true,
          readAt: serverTimestamp(),
          readBy: arrayUnion(userEmail),
        });
      }
    }
  } catch (error) {
    console.error("Error marking message as read:", error);
  }
};

export const markMessagesAsReadInDB = async (
  messageIds: string[],
  userEmail: string
) => {
  try {
    const promises = messageIds.map(async (messageId) => {
      const messageRef = doc(db, "messages", messageId);
      const messageDoc = await getDoc(messageRef);

      if (messageDoc.exists()) {
        const currentReadBy = messageDoc.data().readBy || [];

        if (!currentReadBy.includes(userEmail)) {
          await updateDoc(messageRef, {
            isRead: true,
            readAt: new Date().toISOString(),
            readBy: arrayUnion(userEmail),
          });
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
};

export const getUnreadMessages = (
  messages: any[],
  currentUserEmail: string
): string[] => {
  return messages
    .filter((message) => {
      if (message.user === currentUserEmail) return false;

      const readBy = message.readBy || [];
      return !readBy.includes(currentUserEmail);
    })
    .map((message) => message.id);
};

export const isMessageReadByUser = (
  message: any,
  userEmail: string
): boolean => {
  const readBy = message.readBy || [];
  return readBy.includes(userEmail);
};

export const getReadReceiptStatus = (
  message: any,
  conversationUsers: string[],
  currentUserEmail: string
): {
  isRead: boolean;
  readByUsers: string[];
  isFullyRead: boolean;
} => {
  const readBy = message.readBy || [];
  const otherUsers = conversationUsers.filter(
    (user) => user !== currentUserEmail
  );

  return {
    isRead: readBy.length > 0,
    readByUsers: readBy,
    isFullyRead: otherUsers.every((user) => readBy.includes(user)),
  };
};
