import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "../../config/firebase";
import { IMessage } from "../../types";
import { transformMessage } from "../../utils/getMessagesInConversation";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuIcon from "@mui/icons-material/Menu";
import ImageModal from "../modals/ImageModal";
import { useMediaQuery } from "@mui/material";

const SidebarContainer = styled.div<{ isOpen: boolean }>`
  height: 100vh;
  overflow-y: scroll;
  border-right: 1px solid whitesmoke;
  transition: all 0.3s ease-in-out;
  position: fixed;
  top: 0;
  right: 0;
  background-color: white;
  z-index: 1000;

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  width: 400px;
  min-width: 300px;
  max-width: 400px;
  transform: ${({ isOpen }) => (isOpen ? "translateX(0)" : "translateX(100%)")};
  visibility: ${({ isOpen }) => (isOpen ? "visible" : "hidden")};
  opacity: ${({ isOpen }) => (isOpen ? "1" : "0")};

  @media (max-width: 768px) {
    z-index: 1000;
    width: 80%;
    max-width: 320px;
    min-width: auto;
    transform: ${({ isOpen }) =>
      isOpen ? "translateX(0)" : "translateX(100%)"};
    box-shadow: ${({ isOpen }) =>
      isOpen ? "0 0 10px rgba(0, 0, 0, 0.2)" : "none"};
    visibility: ${({ isOpen }) => (isOpen ? "visible" : "hidden")};
    opacity: ${({ isOpen }) => (isOpen ? "1" : "0")};
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  height: 80px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  background-color: var(--header-bg, #f0f0f0);
  position: sticky;
  top: 0;
  z-index: 10;
`;

const SidebarTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color, #111b21);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;

  @media (max-width: 768px) {
    font-size: 1rem;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: var(--sidebar-bg, #ffffff);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 12px 0;
  color: var(--text-color, #111b21);
  font-size: 14px;
  font-weight: 500;
`;

const ImagesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 24px;
`;

const ImageItem = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;

  &:hover::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
  }
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const FilesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  background-color: var(--input-bg, #f0f2f5);
  text-decoration: none;
  color: var(--text-color, #111b21);
  transition: background-color 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: var(--border-color, #e0e0e0);
  }
`;

const FileIcon = styled.div`
  margin-right: 12px;
  color: var(--text-secondary, #667781);
`;

const FileName = styled.span`
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Overlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: ${({ isOpen }) => (isOpen ? "block" : "none")};
`;

interface ImageSidebarProps {
  conversationId: string;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const ImageSidebar: React.FC<ImageSidebarProps> = ({
  conversationId,
  isOpen,
  toggleSidebar,
}) => {
  const [images, setImages] = useState<IMessage[]>([]);
  const [files, setFiles] = useState<IMessage[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const isMobile = useMediaQuery("(max-width:768px)");

  const imagesQuery = query(
    collection(db, "messages"),
    where("conversation_id", "==", conversationId),
    where("fileUrl", "!=", null),
    orderBy("fileUrl"),
    orderBy("sent_at", "desc")
  );

  const [messagesSnapshot, messagesLoading, messagesError] =
    useCollection(imagesQuery);

  useEffect(() => {
    if (messagesSnapshot) {
      console.log("Messages snapshot:", messagesSnapshot.docs.length);

      const mediaMessages = messagesSnapshot.docs.map((doc) => {
        const message = transformMessage(doc);
        console.log("Message with fileUrl:", message.fileUrl);
        return message;
      });

      const imageMessages = mediaMessages.filter((msg) => {
        if (!msg.fileUrl) return false;

        const imageExtensions = [
          "jpeg",
          "jpg",
          "png",
          "gif",
          "webp",
          "bmp",
          "svg",
          "avif",
          "heic",
          "heif",
        ];
        const urlParts = msg.fileUrl.split("?")[0];
        const extension = urlParts.split(".").pop()?.toLowerCase();

        const isImage =
          (extension && imageExtensions.includes(extension)) ||
          msg.fileUrl.includes("/images/") ||
          msg.fileUrl.match(/image\/(jpeg|jpg|png|gif|webp|bmp|svg)/);
        console.log("Is image?", msg.fileUrl, isImage);
        return isImage;
      });

      const fileMessages = mediaMessages.filter(
        (msg) => msg.fileUrl && !imageMessages.includes(msg)
      );

      console.log("Filtered images:", imageMessages.length);
      console.log("Filtered files:", fileMessages.length);

      setImages(imageMessages);
      setFiles(fileMessages);
    }
  }, [messagesSnapshot]);

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const handleFileDownload = async (fileUrl: string, fileName: string) => {
    try {
      const url = new URL(fileUrl);
    } catch (error) {
      console.error("Invalid file URL:", error);
      alert("Unable to download file: Invalid URL");
      return;
    }

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Failed to fetch file");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error("Error downloading file:", error);

      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <Overlay isOpen={isOpen} onClick={toggleSidebar} />

      <SidebarContainer isOpen={isOpen}>
        <SidebarHeader>
          <SidebarTitle>Media, Links and Docs</SidebarTitle>
          <IconButton
            onClick={toggleSidebar}
            sx={{
              color: "var(--text-color, #111b21)",
              "&:hover": {
                backgroundColor: "var(--border-color, #e0e0e0)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </SidebarHeader>

        <SidebarContent>
          {images.length > 0 && (
            <>
              <SectionTitle>Images ({images.length})</SectionTitle>
              <ImagesGrid>
                {images.map((image, index) => (
                  <ImageItem
                    key={image.id}
                    onClick={() => openImageModal(image.fileUrl || "")}
                  >
                    <StyledImage
                      src={image.fileUrl}
                      alt={`Image ${index + 1}`}
                    />
                  </ImageItem>
                ))}
              </ImagesGrid>
            </>
          )}

          {files.length > 0 && (
            <>
              <SectionTitle>Documents ({files.length})</SectionTitle>
              <FilesList>
                {files.map((file) => (
                  <FileItem
                    key={file.id}
                    onClick={() =>
                      handleFileDownload(
                        file.fileUrl!,
                        file.fileUrl?.split("/").pop() || "File"
                      )
                    }
                  >
                    <FileIcon>
                      <InsertDriveFileIcon />
                    </FileIcon>
                    <FileName>
                      {file.fileUrl?.split("/").pop() || "File"}
                    </FileName>
                  </FileItem>
                ))}
              </FilesList>
            </>
          )}

          {images.length === 0 && files.length === 0 && (
            <div
              style={{
                textAlign: "center",
                marginTop: "40px",
                color: "var(--text-secondary, #667781)",
              }}
            >
              <ImageIcon style={{ fontSize: 48, opacity: 0.5 }} />
              <p>No media found in this conversation</p>
            </div>
          )}
        </SidebarContent>
      </SidebarContainer>

      <ImageModal
        imageUrl={selectedImage}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      />
    </>
  );
};

export default ImageSidebar;
