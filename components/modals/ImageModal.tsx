"use client";

import { useEffect, useState, memo, useCallback } from "react";
import styled from "styled-components";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "../common/Button";

const ModalOverlay = styled.div<{ isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  visibility: ${({ isVisible }) => (isVisible ? "visible" : "hidden")};
  transition: all 0.3s ease;
  cursor: zoom-out;
`;

const ModalContent = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalImage = styled.img`
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  cursor: default;
  user-select: none;
`;

const CloseButton = styled(IconButton)`
  position: absolute !important;
  top: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.6) !important;
  color: white !important;

  &:hover {
    background-color: rgba(0, 0, 0, 0.8) !important;
  }

  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
  }
`;

const LoadingSpinner = styled.div`
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 3px solid #ffffff;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

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
      <ModalOverlay isVisible={isVisible} onClick={handleOverlayClick}>
        <ModalContent onClick={handleContentClick}>
          {isLoading && <LoadingSpinner />}

          {hasError ? (
            <div style={{ color: "white", textAlign: "center" }}>
              <p>Failed to load image</p>
              <p style={{ fontSize: "14px", opacity: 0.7 }}>
                The image could not be displayed
              </p>
            </div>
          ) : (
            <ModalImage
              src={imageUrl}
              alt={altText}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: isLoading ? "none" : "block" }}
            />
          )}

          <CloseButton onClick={handleClose}>
            <CloseIcon />
          </CloseButton>
        </ModalContent>
      </ModalOverlay>
    );
  }
);

ImageModal.displayName = "ImageModal";

export default ImageModal;
