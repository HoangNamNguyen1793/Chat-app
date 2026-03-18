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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCheckDouble,
  faPaperclip,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";

interface SystemMessageProps {
  isSystemMessage: boolean;
}

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
          message.fileUrl,
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
        /* Container căn giữa toàn bộ dòng thông báo */
        <div className="flex justify-center w-full my-6 px-4">
          {/* Bong bóng tin nhắn hệ thống: mờ, chữ nhỏ, bo góc nhẹ */}
          <div
            className="
        bg-[#2a2b30]/5 
        backdrop-blur-sm 
        px-4 py-1.5 
        rounded-full 
        border border-white/10 
        text-[12px] 
        text-gray-400 
        italic 
        tracking-wide 
        shadow-sm
      "
          >
            {message.text}
          </div>
        </div>
      );
    }

    return (
      <>
        <div
          className={`flex w-full mb-4 ${isOwnMessage ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`
      relative group max-w-[70%] px-3 py-2 rounded-2xl transition-all duration-200
      ${
        isOwnMessage
          ? "bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-tr-none shadow-lg"
          : "bg-[#2b2d31] text-gray-200 rounded-tl-none border border-white/5"
      }
    `}
          >
            {/* 1. File/Image Attachment */}
            {message.fileUrl && !isDeleted && (
              <div className="mb-2 overflow-hidden rounded-lg">
                {isImageFile(message.fileUrl) ? (
                  <img
                    src={message.fileUrl}
                    alt="Shared"
                    onClick={handleImageClick}
                    className="max-w-full h-auto cursor-pointer hover:brightness-90 transition-all"
                  />
                ) : (
                  <div
                    onClick={() =>
                      handleFileDownload(
                        message.fileUrl!,
                        getFileName(message.fileUrl!),
                      )
                    }
                    className="flex items-center gap-3 p-3 bg-black/20 rounded-lg cursor-pointer hover:bg-black/30 transition-colors"
                  >
                    <FontAwesomeIcon
                      icon={faPaperclip}
                      className="text-gray-300"
                    />
                    <span className="text-sm truncate max-w-[150px]">
                      {getFileName(message.fileUrl)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 2. Message Text */}
            <div className="text-[15px] leading-relaxed break-words">
              {isDeleted ? (
                <span className="italic opacity-60 flex items-center gap-1 text-sm">
                  <FontAwesomeIcon icon={faTrashCan} className="text-[12px]" />
                  This message was deleted
                </span>
              ) : (
                message.text && <span>{message.text}</span>
              )}
            </div>

            {/* 3. Spacer logic */}
            {!message.fileUrl && message.text && message.text.length < 20 && (
              <div className="h-2" />
            )}

            {/* 4. Timestamp & Read Receipts */}
            <div
              className={`flex items-center gap-1 mt-1 text-[10px] opacity-70 ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              {message.sent_at}

              {isOwnMessage && !isDeleted && (
                <span
                  title={`Read by: ${readReceiptStatus.readByUsers.join(", ")}`}
                  className="ml-1"
                >
                  {readReceiptStatus.isFullyRead ? (
                    <FontAwesomeIcon
                      icon={faCheckDouble}
                      className="text-[#667eea]-400"
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={readReceiptStatus.isRead ? faCheckDouble : faCheck}
                      className={
                        readReceiptStatus.isRead
                          ? "text-gray-300"
                          : "opacity-40"
                      }
                    />
                  )}
                </span>
              )}
            </div>

            {/* 5. Quick Actions (Delete button) - Hiện ra khi hover vào bubble */}
            {isOwnMessage && !isDeleted && (
              <div
                className={`
        absolute top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200
        ${isOwnMessage ? "right-2" : "left-2"}
      `}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
                  }}
                  className="bg-[#1e1f22] border border-white/10 p-1.5 rounded-full text-gray-400 hover:text-red-400 hover:shadow-lg transition-all"
                >
                  <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                </button>
              </div>
            )}
          </div>
        </div>

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
  },
);

Message.displayName = "Message";

export default Message;
