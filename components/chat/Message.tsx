"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import styled from "styled-components";
import { auth, db } from "../../config/firebase";
import { IMessage } from "../../types";
import { memo, useState } from "react";
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { getReadReceiptStatus } from "../../utils/readReceipts";
import { serverTimestamp } from "firebase/firestore";

interface SystemMessageProps {
  isSystemMessage: boolean;
}

const SystemMessageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 16px 20px;
  padding: 8px 16px;
`;

const SystemMessageBubble = styled.div`
  background-color: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  color: #8b5cf6;
  text-align: center;
  max-width: 70%;
  font-weight: 500;
`;

interface MessageContainerProps {
  isOwnMessage: boolean;
}

const MessageContainer = styled.div<MessageContainerProps>`
  display: flex;
  align-items: center;
  margin: 12px 20px;
  width: 100%;
  animation: fadeInUp 0.3s ease-out;
  position: relative;
  gap: 8px;

  /* Ensure proper alignment */
  ${({ isOwnMessage }) =>
    isOwnMessage
      ? `
    flex-direction: row-reverse;
    justify-content: flex-start;
    margin-left: auto;
    margin-right: 20px;
  `
      : `
    flex-direction: row;
    justify-content: flex-start;
    margin-left: 20px;
    margin-right: auto;
  `}

  &:hover .message-actions {
    opacity: 1;
    align-items: center;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const MessageBubble = styled.div<MessageContainerProps>`
  max-width: 75%;
  min-width: 180px;
  padding: 16px 20px 32px;
  border-radius: 20px;
  position: relative;
  word-wrap: break-word;
  transition: all 0.3s ease;
  cursor: pointer;
  flex-shrink: 0;

  /* Clear any existing float or margin that might interfere */
  float: none;

  ${({ isOwnMessage }) =>
    isOwnMessage
      ? `
    /* User messages - RIGHT side */
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-bottom-right-radius: 6px;
    margin-left: auto;
    margin-right: 0;
    box-shadow: 0 4px 20px rgba(103, 126, 234, 0.3);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(103, 126, 234, 0.4);
    }
  `
      : `
    /* Other messages - LEFT side */
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    color: #333;
    border-bottom-left-radius: 6px;
    margin-left: 0;
    margin-right: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
      background: rgba(255, 255, 255, 0.98);
    }
  `}

  @media (max-width: 768px) {
    max-width: 85%;
    padding: 14px 18px 22px;
  }
`;

const MessageText = styled.p`
  margin: 0 0 8px 0;
  font-size: 15px;
  line-height: 1.5;
  white-space: pre-wrap;
  font-weight: 400;
  letter-spacing: 0.3px;
  padding-right: 20px;
`;

const MessageTimestamp = styled.span<MessageContainerProps>`
  position: absolute;
  bottom: 8px;
  right: 16px;
  font-size: 11px;
  user-select: none;
  font-weight: 500;
  opacity: 0.7;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  min-width: fit-content;

  ${({ isOwnMessage }) =>
    isOwnMessage
      ? `
    color: rgba(255, 255, 255, 0.8);
  `
      : `
    color: #8B5CF6;
  `}

  .message-bubble:hover & {
    opacity: 1;
  }
`;

const ReadReceiptIcon = styled.div<{ isRead: boolean; isFullyRead: boolean }>`
  display: flex;
  align-items: center;
  margin-left: 4px;

  .MuiSvgIcon-root {
    font-size: 14px;
    color: ${({ isRead, isFullyRead }) => {
      if (isRead) return "rgba(255, 255, 255, 0.8)";
      return "rgba(255, 255, 255, 0.4)";
    }};
    transition: color 0.3s ease;
  }
`;

const MessageMedia = styled.div`
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  max-width: 320px;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.02);
  }
`;

const MediaImage = styled.img`
  width: 100%;
  height: auto;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  object-fit: cover;

  &:hover {
    opacity: 0.95;
    transform: scale(1.05);
  }
`;

const FileAttachment = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(103, 126, 234, 0.1);
  border: 1px solid rgba(103, 126, 234, 0.2);
  border-radius: 12px;
  text-decoration: none;
  color: #667eea;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    background: rgba(103, 126, 234, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(103, 126, 234, 0.3);
  }
`;

const FileIcon = styled.span`
  margin-right: 12px;
  font-size: 18px;
  filter: grayscale(0%);
`;

const FileName = styled.span`
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3px;
`;

const MessageActions = styled.div<MessageContainerProps>`
  position: absolute;
  display: flex;
  flex-direction: row;
  opacity: 0;
  transition: opacity 0.2s ease;
  gap: 4px;
  z-index: 10;
  flex-shrink: 0;
  align-items: center;
  ${({ isOwnMessage }) =>
    isOwnMessage
      ? `
    top: 8px;
    right: 8px;
  `
      : `
    top: 8px;
    right: 8px;
  `}

  .MuiIconButton-root {
    padding: 6px;
    width: 32px;
    height: 32px;
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 1);
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .MuiSvgIcon-root {
      font-size: 16px;
      color: #666;
    }
  }
`;

const DeletedMessageText = styled.span`
  color: #999;
  font-style: italic;
  font-size: 14px;
  opacity: 0.7;
`;

interface MessageProps {
  message: IMessage;
  onImageClick?: (imageUrl: string) => void;
  onDelete?: (messageId: string) => void;
  conversationUsers: string[];
}

const Message = memo(
  ({ message, onImageClick, onDelete, conversationUsers }: MessageProps) => {
    const [loggedInUser] = useAuthState(auth);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const isOwnMessage = loggedInUser?.email === message.user;
    const isSystemMessage =
      message.user === "system" || (message as any).isSystemMessage;

    const readReceiptStatus = loggedInUser?.email
      ? getReadReceiptStatus(message, conversationUsers, loggedInUser.email)
      : { isRead: false, readByUsers: [], isFullyRead: false };

    const isImageFile = (url: string) => {
      return (
        url.includes("image") ||
        /\.(jpeg|jpg|png|gif|webp|bmp|svg)($|\?)/.test(url.toLowerCase())
      );
    };

    const getFileName = (url: string) => {
      return url.split("/").pop() || "File";
    };

    const handleImageClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (message.fileUrl && onImageClick) {
        console.log(
          "Image clicked, calling onImageClick with:",
          message.fileUrl
        );
        onImageClick(message.fileUrl);
      }
    };

    const handleFileDownload = async (fileUrl: string, fileName: string) => {
      try {
        const url = new URL(fileUrl);
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = sanitizedFileName;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Error downloading file:", error);

        window.open(fileUrl, "_blank", "noopener,noreferrer");
      }
    };

    const handleDelete = async () => {
      if (!message.id || !isOwnMessage) return;

      setIsDeleting(true);
      try {
        await updateDoc(doc(db, "messages", message.id), {
          text: "🗑️ This message was deleted",
          fileUrl: null,
          deletedAt: serverTimestamp(),
          isDeleted: true,
        });

        onDelete?.(message.id);
        setIsDeleteDialogOpen(false);
      } catch (error) {
        console.error("Error deleting message:", error);
        alert("Failed to delete message. Please try again.");
      } finally {
        setIsDeleting(false);
      }
    };

    const isDeleted =
      message.text === "🗑️ This message was deleted" ||
      message.text?.startsWith("🗑️") ||
      (message as any).isDeleted;

    if (isSystemMessage) {
      return (
        <SystemMessageContainer>
          <SystemMessageBubble>{message.text}</SystemMessageBubble>
        </SystemMessageContainer>
      );
    }

    return (
      <>
        <MessageContainer isOwnMessage={isOwnMessage}>
          <MessageBubble className="message-bubble" isOwnMessage={isOwnMessage}>
            {/* File/Image attachment */}
            {message.fileUrl && !isDeleted && (
              <>
                {isImageFile(message.fileUrl) ? (
                  <MessageMedia>
                    <MediaImage
                      src={message.fileUrl}
                      alt="Shared image"
                      onClick={handleImageClick}
                    />
                  </MessageMedia>
                ) : (
                  <FileAttachment
                    onClick={() =>
                      handleFileDownload(
                        message.fileUrl!,
                        getFileName(message.fileUrl!)
                      )
                    }
                  >
                    <FileIcon>📎</FileIcon>
                    <FileName>{getFileName(message.fileUrl!)}</FileName>
                  </FileAttachment>
                )}
              </>
            )}

            {/* Message text */}
            {isDeleted ? (
              <DeletedMessageText>
                🗑️ This message was deleted
              </DeletedMessageText>
            ) : (
              message.text && <MessageText>{message.text}</MessageText>
            )}

            {/* Spacer to ensure timestamp doesn't overlap */}
            {!message.fileUrl && message.text && message.text.length < 20 && (
              <div style={{ height: "16px" }} />
            )}

            <MessageTimestamp isOwnMessage={isOwnMessage}>
              {message.sent_at}
              {isOwnMessage && !isDeleted && (
                <ReadReceiptIcon
                  isRead={readReceiptStatus.isRead}
                  isFullyRead={readReceiptStatus.isFullyRead}
                  title={`Read by: ${readReceiptStatus.readByUsers.join(", ")}`}
                >
                  {readReceiptStatus.isFullyRead ? (
                    <DoneAllIcon />
                  ) : readReceiptStatus.isRead ? (
                    <DoneIcon />
                  ) : (
                    <DoneIcon style={{ opacity: 0.4 }} />
                  )}
                </ReadReceiptIcon>
              )}
            </MessageTimestamp>

            {/* Delete button - only show for own messages and non-deleted messages */}
            {isOwnMessage && !isDeleted && (
              <MessageActions
                className="message-actions"
                isOwnMessage={isOwnMessage}
              >
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
                  }}
                  size="small"
                  title="Delete message"
                >
                  <DeleteIcon />
                </IconButton>
              </MessageActions>
            )}
          </MessageBubble>
        </MessageContainer>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Delete Message</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this message? This action cannot be
            undone.
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              color="error"
              variant="contained"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
);

Message.displayName = "Message";

export default Message;
