"use client";

import React, { useState, useRef, memo } from "react";
import styled from "styled-components";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SendIcon from "@mui/icons-material/Send";
import { IconButton } from "../common/Button";
import EmojiPicker from "./EmojiPicker";

const InputContainer = styled.form`
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  position: sticky;
  bottom: 0;
  z-index: 100;
  gap: 12px;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
`;

const MessageInput = styled.input`
  flex: 1;
  outline: none;
  border: 1px solid rgba(103, 126, 234, 0.2);
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 14px 20px;
  font-size: 15px;
  color: #333;
  transition: all 0.3s ease;
  font-weight: 400;
  letter-spacing: 0.3px;

  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(103, 126, 234, 0.1);
    background: rgba(255, 255, 255, 0.95);
    transform: translateY(-1px);
  }

  &::placeholder {
    color: #8b5cf6;
    opacity: 0.7;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

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
      <InputContainer onSubmit={handleSubmit}>
        <EmojiPicker onEmojiSelect={handleEmojiSelect} />

        <MessageInput
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
        />

        <ActionsContainer>
          <IconButton
            onClick={handleFileClick}
            disabled={disabled}
            style={{
              background: "rgba(103, 126, 234, 0.1)",
              border: "1px solid rgba(103, 126, 234, 0.2)",
              borderRadius: "12px",
              transition: "all 0.3s ease",
            }}
          >
            <AttachFileIcon sx={{ fontSize: 22, color: "#667eea" }} />
          </IconButton>

          <IconButton
            onClick={() => {
              if (canSend) {
                onSend();
              }
            }}
            disabled={!canSend}
            style={{
              background: canSend
                ? "linear-gradient(135deg, #667eea, #764ba2)"
                : "rgba(139, 92, 246, 0.1)",
              color: canSend ? "white" : "#8B5CF6",
              border: `1px solid ${
                canSend ? "transparent" : "rgba(139, 92, 246, 0.2)"
              }`,
              borderRadius: "12px",
              transition: "all 0.3s ease",
              transform: canSend ? "scale(1.05)" : "scale(1)",
              boxShadow: canSend
                ? "0 4px 20px rgba(103, 126, 234, 0.3)"
                : "none",
            }}
          >
            <SendIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </ActionsContainer>

        <HiddenFileInput
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />
      </InputContainer>
    );
  }
);

ChatInput.displayName = "ChatInput";

export default ChatInput;
