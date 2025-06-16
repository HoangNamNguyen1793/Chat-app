"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import styled from "styled-components";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import { IconButton } from "../common/Button";

const PickerWrapper = styled.div`
  position: relative;
`;

const PickerContainer = styled.div<{ isVisible: boolean }>`
  position: absolute;
  bottom: 50px;
  left: 0;
  background: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  z-index: 1000;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  visibility: ${({ isVisible }) => (isVisible ? "visible" : "hidden")};
  transform: ${({ isVisible }) =>
    isVisible ? "translateY(0)" : "translateY(10px)"};
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    bottom: 60px;
    left: -150px;
  }
`;

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPickerComponent = memo(({ onEmojiSelect }: EmojiPickerProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setShowPicker(false);
  };

  const togglePicker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPicker(!showPicker);
  };

  return (
    <PickerWrapper ref={pickerRef}>
      <IconButton onClick={togglePicker}>
        <InsertEmoticonIcon
          sx={{
            fontSize: 24,
            color: showPicker ? "#25d366" : "#555",
            transition: "color 0.2s ease",
          }}
        />
      </IconButton>

      <PickerContainer isVisible={showPicker}>
        {showPicker && (
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={300}
            height={400}
            previewConfig={{
              showPreview: false,
            }}
          />
        )}
      </PickerContainer>
    </PickerWrapper>
  );
});

EmojiPickerComponent.displayName = "EmojiPickerComponent";

export default EmojiPickerComponent;
