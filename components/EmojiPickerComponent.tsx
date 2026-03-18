"use client";

import React, { useState } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import styled from "styled-components";
import { FaSmile } from "react-icons/fa";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";

import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFaceSmile } from "@fortawesome/free-solid-svg-icons";

const EmojiPickerComponent = ({
  onSelect,
}: {
  onSelect: (emoji: string) => void;
}) => {
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

  return (
    <div className="relative inline-block">
      {/* Emoji Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setShowPicker(!showPicker);
        }}
        className="p-2 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95 text-gray-400 hover:text-yellow-500"
      >
        <FontAwesomeIcon icon={faFaceSmile} className="text-2xl" />
      </button>

      {/* Emoji Picker Container */}
      {showPicker && (
        <>
          {/* Overlay để đóng khi click ra ngoài */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowPicker(false)}
          />

          <div className="absolute bottom-full left-0 mb-2 z-20 shadow-xl border border-gray-200 rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                onSelect(emojiData.emoji);
                setShowPicker(false);
              }}
              // Bạn có thể thêm các thuộc tính width/height cho EmojiPicker ở đây
              lazyLoadEmojis={true}
              previewConfig={{ showPreview: false }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default EmojiPickerComponent;
