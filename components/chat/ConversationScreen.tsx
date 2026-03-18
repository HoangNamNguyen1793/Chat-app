"use client";

import { useRecipient } from "../../hooks/useRecipient";
import { Conversation, IMessage } from "../../types";
import {
  convertFirestoreTimestampToString,
  generateQueryGetMessages,
  transformMessage,
} from "../../utils/getMessagesInConversation";
import RecipientAvatar from "../RecipientAvatar";
import {
  isGroupConversation,
  getGroupDisplayName,
  isUserAdmin,
} from "../../utils/groupUtils";
import GroupMembersDialog from "../modals/GroupMembersDialog";

import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../config/firebase";
import { useCollection } from "react-firebase-hooks/firestore";
import Message from "./Message";
import { useMemo } from "react";

import {
  KeyboardEventHandler,
  MouseEventHandler,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import EmojiPickerComponent from "../EmojiPickerComponent";
import ImageSidebar from "../layout/ImageSidebar";

import FileReviewComponent from "../FileReviewComponent";
import axios from "axios";

import ImageModal from "../modals/ImageModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faMagnifyingGlass,
  faPaperclip,
  faPaperPlane,
  faUserGroup,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const ConversationScreen = ({
  conversation,
  messages,
}: {
  conversation: Conversation;
  messages: IMessage[];
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [loggedInUser, _loading, _error] = useAuthState(auth);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<
    { file: File; preview: string }[]
  >([]);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [isUploading, setIsUploading] = useState(false);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isImageSidebarOpen, setIsImageSidebarOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const MAX_FILES = 5;
  const conversationUsers = conversation.users;

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IMessage[]>([]);
  const [isGroupMembersOpen, setIsGroupMembersOpen] = useState(false);

  const { recipientEmail, recipient, recipientName } =
    useRecipient(conversationUsers);

  const isGroup = isGroupConversation(conversation);
  const displayName = isGroup
    ? getGroupDisplayName(conversation)
    : recipientName;
  const isCurrentUserAdmin = isGroup
    ? isUserAdmin(conversation, loggedInUser?.email || "")
    : false;

  const router = useRouter();

  const conversationId = router.query.id as string | undefined;
  const queryGetMessages = useMemo(
    () => (conversationId ? generateQueryGetMessages(conversationId) : null),
    [conversationId],
  );
  const [messagesSnapshot, messagesLoading, __error] =
    useCollection(queryGetMessages);
  useCollection(queryGetMessages);

  const searchMessages = () => {
    if (!searchQuery.trim() || !messagesSnapshot) return;

    const results = messagesSnapshot.docs
      .map((message) => transformMessage(message))
      .filter(
        (m) =>
          typeof m.text === "string" &&
          m.text.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    setSearchResults(results);
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      searchMessages();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, messagesSnapshot]);

  const scrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth" });
      messageElement.classList.add("highlight-message");
      setTimeout(() => {
        messageElement.classList.remove("highlight-message");
      }, 2000);
    }
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input changed", event.target.files);
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);

      if (selectedFiles.length + newFiles.length > MAX_FILES) {
        alert(
          `Bạn chỉ có thể tải lên tối đa ${MAX_FILES} tệp cùng lúc. Hiện tại bạn đã chọn ${selectedFiles.length} tệp.`,
        );
        return;
      }

      const oversizedFiles = newFiles.filter(
        (file) => file.size > MAX_FILE_SIZE,
      );
      if (oversizedFiles.length > 0) {
        alert(
          `Các tệp sau vượt quá giới hạn 10MB: ${oversizedFiles
            .map((f) => `${f.name} (${(f.size / (1024 * 1024)).toFixed(2)}MB)`)
            .join(", ")}`,
        );
        return;
      }

      const updatedFiles = [...selectedFiles, ...newFiles];
      setSelectedFiles(updatedFiles);

      const newPreviews: { file: File; preview: string }[] = [];

      newFiles.forEach((file) => {
        if (file.type.startsWith("image/")) {
          try {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target && e.target.result) {
                newPreviews.push({
                  file,
                  preview: e.target.result as string,
                });

                if (newPreviews.length === newFiles.length) {
                  setFilePreviews((prev) => [...prev, ...newPreviews]);
                }
              }
            };
            reader.readAsDataURL(file);
          } catch (error) {
            console.error("Error reading file:", error);
            newPreviews.push({
              file,
              preview: "non-image",
            });
          }
        } else {
          newPreviews.push({
            file,
            preview: "non-image",
          });
        }
      });

      if (newPreviews.length === newFiles.length) {
        setFilePreviews((prev) => [...prev, ...newPreviews]);
      }
    } else {
      console.log("No files selected");
    }
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    setFilePreviews([]);

    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMessageDelete = (messageId: string) => {
    console.log(`Message ${messageId} deleted successfully`);
  };

  const handleImageClick = (imageUrl: string) => {
    console.log("Image clicked in ConversationScreen:", imageUrl);
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const showMessages = () => {
    if (messagesLoading) {
      return messages.map((message) => (
        <Message
          key={message.id}
          message={message}
          onDelete={handleMessageDelete}
          onImageClick={handleImageClick}
          conversationUsers={conversationUsers}
        />
      ));
    }

    if (messagesSnapshot) {
      return messagesSnapshot.docs.map((message) => {
        const msgData = transformMessage(message);
        return (
          <div key={message.id} id={`message-${message.id}`}>
            <Message
              message={msgData}
              onDelete={handleMessageDelete}
              onImageClick={handleImageClick}
              conversationUsers={conversationUsers}
            />
          </div>
        );
      });
    }

    return null;
  };
  const uploadToCloudinary = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);

      axios
        .post("/api/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent: any) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100,
              );
              setUploadProgress((prev) => ({
                ...prev,
                [file.name]: progress,
              }));
            }
          },
        })
        .then((response) => {
          resolve(response.data.url);
        })
        .catch((error) => {
          reject(new Error(`Upload failed: ${error.message}`));
        });
    });
  };

  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!loggedInUser?.email || !conversationId) return;

      try {
        const unreadMessagesQuery = query(
          collection(db, "messages"),
          where("conversation_id", "==", conversationId),
          where("user", "!=", loggedInUser.email),
          where("isRead", "==", false),
        );

        const unreadMessagesSnapshot = await getDocs(unreadMessagesQuery);

        const updatePromises = unreadMessagesSnapshot.docs.map(
          async (messageDoc) => {
            await updateDoc(doc(db, "messages", messageDoc.id), {
              isRead: true,
              readAt: serverTimestamp(),
            });
          },
        );

        await Promise.all(updatePromises);
      } catch (error) {
        console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error);
      }
    };

    markMessagesAsRead();
  }, [conversationId, loggedInUser?.email, messagesSnapshot]);

  const addMessageToDbAndUpdateLastSeen = async () => {
    const fileUrls: string[] = [];
    setIsUploading(true);

    try {
      if (selectedFiles.length > 0) {
        const progressCopy = { ...uploadProgress };

        for (const file of selectedFiles) {
          try {
            const fileUrl = await uploadToCloudinary(file);
            fileUrls.push(fileUrl);
          } catch (error) {
            console.error(`Upload failed for ${file.name}:`, error);
          }
        }
      }

      await setDoc(
        doc(db, "users", loggedInUser?.email as string),
        { lastSeen: serverTimestamp() },
        { merge: true },
      );

      if (fileUrls.length > 0) {
        for (const fileUrl of fileUrls) {
          await addDoc(collection(db, "messages"), {
            conversation_id: conversationId,
            sent_at: serverTimestamp(),
            text: newMessage || "",
            fileUrl,
            user: loggedInUser?.email,
            isRead: false,
          });
        }
      } else {
        await addDoc(collection(db, "messages"), {
          conversation_id: conversationId,
          sent_at: serverTimestamp(),
          text: newMessage,
          user: loggedInUser?.email,
          isRead: false,
        });
      }

      setNewMessage("");
      clearSelectedFiles();
      setUploadProgress({});
      setIsUploading(false);
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      setIsUploading(false);
    }
  };

  const sendMessageOnEnter: KeyboardEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      console.log("Enter pressed", { newMessage, selectedFiles });
      if (!newMessage && selectedFiles.length === 0) return;
      addMessageToDbAndUpdateLastSeen();
    }
  };

  const sendMessageOnClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    console.log("Send button clicked", { newMessage, selectedFiles });
    if (!newMessage && selectedFiles.length === 0) return;
    addMessageToDbAndUpdateLastSeen();
  };

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };
  const toggleImageSidebar = () => {
    setIsImageSidebarOpen(!isImageSidebarOpen);
  };

  return (
    <>
      <header className="flex items-center p-4 bg-[#1e1f22] backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        {isGroup ? (
          /* Avatar cho Group */
          <div className="flex items-center justify-center w-[50px] h-[50px] rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] mr-3 shadow-md transition-all duration-300 hover:scale-105">
            <FontAwesomeIcon icon={faUsers} className="text-white text-xl" />
          </div>
        ) : (
          /* Avatar cho Cá nhân - Giữ component RecipientAvatar nhưng có thể bọc ngoài nếu cần */
          <div className="mr-3">
            <RecipientAvatar
              recipient={recipient}
              recipientEmail={recipientEmail}
              recipientName={recipientName}
              size="large"
              showOnlineStatus={true}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-300 truncate m-0">
            {displayName}
          </h3>

          <div className="text-xs text-gray-400 flex items-center gap-1 truncate">
            {isGroup ? (
              <>
                <span>{conversation.users?.length || 0} members</span>
                {conversation.groupDescription && (
                  <span className="flex items-center">
                    <span className="mx-1">•</span>
                    <span className="truncate">
                      {conversation.groupDescription}
                    </span>
                  </span>
                )}
              </>
            ) : (
              recipient && (
                <span>
                  Last active:{" "}
                  {convertFirestoreTimestampToString(recipient.lastSeen)}
                </span>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 ml-4">
          {/* Nút Search */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2b30]/10 rounded-full transition-colors"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-lg" />
          </button>

          {/* Nút Xem thành viên nhóm */}
          {isGroup && (
            <button
              onClick={() => setIsGroupMembersOpen(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2b30]/10 rounded-full transition-colors"
            >
              <FontAwesomeIcon icon={faUserGroup} className="text-lg" />
            </button>
          )}

          {/* Nút Ảnh/Media */}
          <button
            onClick={toggleImageSidebar}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2b30]/10 rounded-full transition-colors"
          >
            <FontAwesomeIcon icon={faImage} className="text-lg" />
          </button>
        </div>
      </header>

      {isSearchOpen && (
        <div className="absolute top-0 left-0 w-full z-20 bg-[#1e1f22]/95 backdrop-blur-md border-b border-white/10 shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Search Input Area */}
          <div className="flex items-center w-full px-4 py-3 gap-3">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="text-gray-400 text-sm"
            />

            <input
              type="text"
              placeholder="Nhập từ khóa tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="flex-1 bg-[#2a2b30] border-none outline-none text-white text-sm placeholder-gray-500"
            />

            <button
              onClick={() => setIsSearchOpen(false)}
              className="p-1.5 hover:bg-[#2a2b30]/10 rounded-md text-gray-400 hover:text-white transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="text-lg" />
            </button>
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="max-h-[300px] overflow-y-auto border-t border-white/5 bg-[#1e1f22]">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => scrollToMessage(result.id)}
                  className="px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-[#2a2b30]/5 transition-colors group"
                >
                  <p className="text-sm text-gray-300 group-hover:text-white truncate">
                    {result.text.length > 50
                      ? result.text.substring(0, 50) + "..."
                      : result.text}
                  </p>
                  <span className="text-[10px] text-gray-500 mt-1 block uppercase tracking-wider">
                    {result.sent_at}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="bg-[#1e1f22] flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {showMessages()}

        {/* Phần tử dùng để auto-scroll */}
        <div ref={endOfMessagesRef} className="h-1 w-full" />
      </div>
      <FileReviewComponent
        selectedFiles={selectedFiles}
        filePreviews={filePreviews}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        clearSelectedFiles={clearSelectedFiles}
        removeFile={removeFile}
      />

      <div className="flex items-center gap-2 p-3 bg-[#2b2d31] border border-white/5 shadow-inner">
        {/* Emoji Picker */}
        <EmojiPickerComponent onSelect={handleEmojiSelect} />

        {/* Input chính */}
        <input
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
          onKeyDown={sendMessageOnEnter}
          placeholder="Nhập tin nhắn..."
          className="flex-1 bg-[#1e1f22] border-none outline-none rounded-xl text-gray-200 placeholder-gray-500 text-sm py-1.5 "
        />

        <div className="flex items-center gap-1">
          {/* Nút Gửi */}
          <button
            onClick={sendMessageOnClick}
            disabled={
              (!newMessage && selectedFiles.length === 0) || isUploading
            }
            className={`
        p-2 rounded-lg transition-all duration-200
        ${
          (!newMessage && selectedFiles.length === 0) || isUploading
            ? "text-gray-400 cursor-not-allowed opacity-50"
            : "text-[#667eea] hover:bg-[#667eea]/10 hover:scale-110 active:scale-95"
        }
      `}
          >
            <FontAwesomeIcon icon={faPaperPlane} className="text-lg" />
          </button>

          {/* Nút Đính kèm */}
          <button
            onClick={() => {
              const fileInput = document.getElementById("fileInput");
              fileInput?.click();
            }}
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2b30]/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faPaperclip} className="text-lg" />
          </button>
        </div>

        {/* Input file ẩn */}
        <input
          type="file"
          id="fileInput"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <ImageModal
        imageUrl={selectedImage}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      />

      {conversationId && (
        <ImageSidebar
          conversationId={conversationId as string}
          isOpen={isImageSidebarOpen}
          toggleSidebar={toggleImageSidebar}
        />
      )}

      {/* Group Members Dialog */}
      {isGroup && (
        <GroupMembersDialog
          open={isGroupMembersOpen}
          onClose={() => setIsGroupMembersOpen(false)}
          conversation={conversation}
          conversationId={conversationId as string}
        />
      )}
    </>
  );
};

export default ConversationScreen;
