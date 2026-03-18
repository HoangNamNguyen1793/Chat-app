"use client";

import styled from "styled-components";
import { memo } from "react";
import { useRecipient } from "../../hooks/useRecipient";
import { Conversation } from "../../types";
import UserAvatar from "../common/Avatar";
import { getRecipientName } from "../../utils/getRecipientName";

interface ConversationItemProps {
  conversation: Conversation;
  onClick: () => void;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
}

const ConversationItem = memo(
  ({
    conversation,
    onClick,
    lastMessage,
    timestamp,
    unreadCount = 0,
  }: ConversationItemProps) => {
    const { recipient, recipientEmail, recipientName } = useRecipient(
      conversation.users,
    );

    return (
      <div
        onClick={onClick}
        className="flex items-center p-3 gap-3 cursor-pointer transition-all duration-200 hover:bg-[#2a2b30]/5 active:bg-[#2a2b30]/10 group"
      >
        {/* Avatar - Sử dụng component Avatar bạn đã chuyển đổi trước đó */}
        <UserAvatar
          src={recipient?.photoURL}
          name={recipientName}
          email={recipientEmail}
          size="small"
          margin="0"
        />

        {/* Thông tin chính của cuộc hội thoại */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h4 className="text-[15px] font-semibold text-gray-100 truncate group-hover:text-white transition-colors">
            {recipientName}
          </h4>

          {lastMessage && (
            <p className="text-sm text-gray-500 truncate leading-tight">
              {lastMessage}
            </p>
          )}
        </div>

        {/* Meta data: Thời gian và Số tin nhắn chưa đọc */}
        <div className="flex flex-col items-end justify-between self-stretch py-0.5">
          {timestamp && (
            <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">
              {timestamp}
            </span>
          )}

          {unreadCount > 0 && (
            <div
              className="
        mt-1 min-w-[18px] h-[18px] px-1 
        flex items-center justify-center 
        bg-[#25d366] text-black text-[10px] font-bold 
        rounded-full shadow-lg animate-in zoom-in duration-300
      "
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}
        </div>
      </div>
    );
  },
);

ConversationItem.displayName = "ConversationItem";

export default ConversationItem;
