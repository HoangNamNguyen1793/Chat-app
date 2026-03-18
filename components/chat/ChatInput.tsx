"use client";

import React, { useState, useRef, memo } from "react";
import styled from "styled-components";

import { IconButton } from "../common/Button";
import EmojiPicker from "./EmojiPicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip, faPaperPlane } from "@fortawesome/free-solid-svg-icons";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileSelect: (files: FileList) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput = memo(
  ({
    value,
    onChange,
    onSend,
    onFileSelect,
    disabled = false,
    placeholder = "Type a message...",
  }: ChatInputProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    const handleEmojiSelect = (emoji: string) => {
      onChange(value + emoji);
    };

    const handleFileClick = () => {
      fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileSelect(e.target.files);

        e.target.value = "";
      }
    };

    const canSend = value.trim().length > 0 && !disabled;

    return (
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-2 bg-[#2a2b30] backdrop-blur-md rounded-2xl border border-white/20"
      >
        <EmojiPicker onEmojiSelect={handleEmojiSelect} />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          /* Thay px-3 bằng pl-6 (hoặc giá trị bạn muốn) và pr-3 */
          className="flex-1 bg-[#2a2b30] border-none outline-none pl-6 pr-3 py-2 text-white placeholder-gray-400 disabled:cursor-not-allowed rounded-md"
        />

        <div className="flex items-center gap-2">
          {/* Nút đính kèm file */}
          <button
            type="button"
            onClick={handleFileClick}
            disabled={disabled}
            className="flex items-center justify-center w-10 h-10 rounded-[12px] bg-[#677eea]/10 border border-[#677eea]/20 text-[#667eea] transition-all duration-300 hover:bg-[#677eea]/20 active:scale-95 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faPaperclip} className="text-lg" />
          </button>

          {/* Nút gửi tin nhắn */}
          <button
            type="button"
            onClick={() => canSend && onSend()}
            disabled={!canSend}
            className={`
        flex items-center justify-center w-10 h-10 rounded-[12px] transition-all duration-300
        ${
          canSend
            ? "bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white scale-105 shadow-[0_4px_20px_rgba(103,126,234,0.3)] hover:brightness-110 active:scale-100"
            : "bg-violet-500/10 border border-violet-500/20 text-[#8B5CF6] scale-100 opacity-60"
        }
      `}
          >
            <FontAwesomeIcon icon={faPaperPlane} className="text-lg" />
          </button>
        </div>

        {/* Input file ẩn */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          className="hidden"
        />
      </form>
    );
  },
);

ChatInput.displayName = "ChatInput";

export default ChatInput;
