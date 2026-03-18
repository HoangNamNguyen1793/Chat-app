"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import styled from "styled-components";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import { IconButton } from "../common/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFaceSmile } from "@fortawesome/free-solid-svg-icons";

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
    <div className="relative inline-block" ref={pickerRef}>
      {/* Nút bấm mở Emoji */}
      <button
        type="button"
        onClick={togglePicker}
        className="p-1.5 focus:outline-none transition-colors duration-200 group"
      >
        <FontAwesomeIcon
          icon={faFaceSmile}
          className={`text-2xl transition-colors duration-200 ${
            showPicker
              ? "text-[#25d366]"
              : "text-gray-500 group-hover:text-gray-300"
          }`}
        />
      </button>

      {/* Container chứa Emoji Picker */}
      {showPicker && (
        <div className="absolute bottom-full mb-3 left-0 z-50 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={300}
            height={400}
            previewConfig={{
              showPreview: false,
            }}
          />
        </div>
      )}
    </div>
  );
});

EmojiPickerComponent.displayName = "EmojiPickerComponent";

export default EmojiPickerComponent;
