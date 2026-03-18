"use client";

import { useEffect, useState, memo, useCallback } from "react";
import styled from "styled-components";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "../common/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleNotch,
  faExclamationTriangle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

interface ImageModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  altText?: string;
}

const ImageModal = memo(
  ({
    imageUrl,
    isOpen,
    onClose,
    altText = "Full size image",
  }: ImageModalProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const handleClose = useCallback(() => {
      setIsVisible(false);
      const timeoutId = setTimeout(() => onClose(), 300);
      return () => clearTimeout(timeoutId);
    }, [onClose]);
    useEffect(() => {
      if (isOpen) {
        setIsVisible(true);
        setIsLoading(true);
        setHasError(false);

        document.body.style.overflow = "hidden";
      } else {
        setIsVisible(false);
        document.body.style.overflow = "auto";
      }

      return () => {
        document.body.style.overflow = "auto";
      };
    }, [isOpen]);

    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          handleClose();
        }
      };

      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }, [isOpen, handleClose]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    };

    const handleImageLoad = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleImageError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    const handleContentClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    if (!isOpen && !isVisible) return null;

    return (
      <>
        {isVisible && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleOverlayClick}
          >
            <div
              className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center justify-center"
              onClick={handleContentClick}
            >
              {/* Loading Spinner */}
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2">
                  <FontAwesomeIcon
                    icon={faCircleNotch}
                    spin
                    size="2xl"
                    className="text-[#667eea]-500"
                  />
                  <p className="text-sm animate-pulse">Loading image...</p>
                </div>
              )}

              {/* Error State */}
              {hasError ? (
                <div className="text-center text-white p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    size="2xl"
                    className="text-red-500 mb-3"
                  />
                  <p className="font-semibold text-lg">Failed to load image</p>
                  <p className="text-sm text-gray-400 opacity-70">
                    The image could not be displayed
                  </p>
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt={altText}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  className={`max-w-full max-h-[85vh] object-contain shadow-2xl transition-all duration-500 ${
                    isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  }`}
                />
              )}

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="fixed top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-[#2a2b30]/10 text-white hover:bg-[#2a2b30]/20 hover:scale-110 transition-all active:scale-95"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>

              {/* Caption (Optional - Nếu bạn muốn hiện Alt text dưới ảnh) */}
              {!isLoading && !hasError && altText && (
                <p className="mt-4 text-gray-300 text-sm italic">{altText}</p>
              )}
            </div>
          </div>
        )}
      </>
    );
  },
);

ImageModal.displayName = "ImageModal";

export default ImageModal;
