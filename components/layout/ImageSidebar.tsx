"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, limit, orderBy, query, where } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { useMediaQuery } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageModal from "../modals/ImageModal";
import { db } from "../../config/firebase";
import { IMessage } from "../../types";
import { transformMessage } from "../../utils/getMessagesInConversation";

interface ImageSidebarProps {
  conversationId: string;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const IMAGE_EXTENSIONS = [
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

const isImageFile = (url?: string | null) => {
  if (!url) return false;

  const normalizedUrl = url.toLowerCase();
  const pathWithoutQuery = normalizedUrl.split("?")[0];
  const extension = pathWithoutQuery.split(".").pop();

  return (
    normalizedUrl.includes("image/upload") ||
    normalizedUrl.includes("/images/") ||
    !!(extension && IMAGE_EXTENSIONS.includes(extension))
  );
};

const getFileName = (url?: string | null) => {
  if (!url) return "Attachment";

  try {
    const parsedUrl = new URL(url);
    const fileName = parsedUrl.pathname.split("/").pop();
    return decodeURIComponent(fileName || "Attachment");
  } catch {
    return decodeURIComponent(url.split("/").pop() || "Attachment");
  }
};

const formatSentAt = (sentAt?: string | null) => sentAt || "Unknown time";

const ImageSidebar = ({
  conversationId,
  isOpen,
  toggleSidebar,
}: ImageSidebarProps) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [selectedImage, setSelectedImage] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const mediaQuery = query(
    collection(db, "messages"),
    where("conversation_id", "==", conversationId),
    where("fileUrl", "!=", null),
    orderBy("fileUrl"),
    orderBy("sent_at", "desc"),
    limit(200),
  );

  const [snapshot, loading, error] = useCollection(mediaQuery);

  const mediaMessages = useMemo(() => {
    if (!snapshot) return [];

    return snapshot.docs
      .map((doc) => transformMessage(doc) as IMessage)
      .filter((message) => !!message.fileUrl && !(message as any).isDeleted);
  }, [snapshot]);

  const images = useMemo(
    () => mediaMessages.filter((message) => isImageFile(message.fileUrl)),
    [mediaMessages],
  );

  const files = useMemo(
    () => mediaMessages.filter((message) => !isImageFile(message.fileUrl)),
    [mediaMessages],
  );

  useEffect(() => {
    if (!isOpen || !isMobile) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobile, isOpen]);

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const handleFileDownload = (fileUrl: string, fileName: string) => {
    try {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (downloadError) {
      console.error("Error downloading file:", downloadError);
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      {isMobile && (
        <div
          onClick={toggleSidebar}
          className={`fixed inset-0 z-[69] bg-[#2b2d31]transition-opacity duration-300 ${
            isOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        />
      )}

      <div className="flex h-screen w-full max-w-[360px] flex-col border-l border-white/10 bg-[#2b2d31] shadow-2xl">
        {/* Header: Đã bỏ nút toggle và chỉnh lại padding/layout */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-sm font-semibold text-white">Media & Files</h2>
            <p className="mt-1 text-xs text-gray-400">
              {mediaMessages.length} attachment
              {mediaMessages.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Body: Giữ nguyên logic hiển thị nội dung */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading && (
            <div className="rounded-xl border border-white/10 bg-[#2a2b30]/[0.03] px-4 py-6 text-center text-sm text-gray-400">
              Loading attachments...
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-6 text-center text-sm text-red-200">
              Failed to load media for this conversation.
            </div>
          )}

          {!loading && !error && mediaMessages.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-gray-400">
              No images or files have been shared in this chat yet.
            </div>
          )}

          {!loading && !error && mediaMessages.length > 0 && (
            <div className="space-y-6">
              {/* Section Images */}
              <section>
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                  <ImageIcon fontSize="small" />
                  <span>Images</span>
                  <span className="text-xs text-gray-500">
                    ({images.length})
                  </span>
                </div>

                {images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {images.map((image) => (
                      <button
                        key={image.id}
                        onClick={() =>
                          image.fileUrl && openImageModal(image.fileUrl)
                        }
                        className="group overflow-hidden rounded-xl border border-white/10 bg-[#2a2b30]/[0.03] text-left transition-all hover:border-white/20 hover:bg-[#2a2b30]/[0.06]"
                      >
                        <img
                          src={image.fileUrl}
                          alt={getFileName(image.fileUrl)}
                          className="h-32 w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                        />
                        <div className="px-3 py-2">
                          <p className="truncate text-xs font-medium text-gray-200">
                            {getFileName(image.fileUrl)}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-500">
                            {formatSentAt(image.sent_at)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-[#2a2b30]/[0.03] px-4 py-4 text-sm text-gray-400">
                    No images found.
                  </div>
                )}
              </section>

              {/* Section Files */}
              <section>
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                  <InsertDriveFileIcon fontSize="small" />
                  <span>Files</span>
                  <span className="text-xs text-gray-500">
                    ({files.length})
                  </span>
                </div>

                {files.length > 0 ? (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <button
                        key={file.id}
                        onClick={() =>
                          file.fileUrl &&
                          handleFileDownload(
                            file.fileUrl,
                            getFileName(file.fileUrl),
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[#2a2b30]/[0.03] px-3 py-3 text-left transition-all hover:border-white/20 hover:bg-[#2a2b30]/[0.06]"
                      >
                        <div className="rounded-lg bg-[#2a2b30]/10 p-2 text-gray-300">
                          <InsertDriveFileIcon fontSize="small" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-200">
                            {getFileName(file.fileUrl)}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-500">
                            {formatSentAt(file.sent_at)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-[#2a2b30]/[0.03] px-4 py-4 text-sm text-gray-400">
                    No non-image files found.
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
      <ImageModal
        imageUrl={selectedImage}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      />
    </>
  );
};

export default ImageSidebar;
