"use client";

import styled from "styled-components";
import { memo } from "react";
import { useRecipient } from "../../hooks/useRecipient";
import { Conversation } from "../../types";
import UserAvatar from "../common/Avatar";
import { getRecipientName } from "../../utils/getRecipientName";

const ItemContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-light, #f0f0f0);
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--hover-bg, #f5f6f6);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ConversationInfo = styled.div`
  flex: 1;
  min-width: 0;
  margin-left: 12px;
`;

const RecipientName = styled.div`
  font-size: 16px;
  font-weight: 400;
  color: var(--text-color, #111b21);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LastMessage = styled.div`
  font-size: 13px;
  color: var(--text-secondary, #667781);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ConversationMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const Timestamp = styled.span`
  font-size: 12px;
  color: var(--text-secondary, #667781);
`;

const UnreadBadge = styled.div`
  background-color: #25d366;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
`;

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
      conversation.users
    );

    return (
      <ItemContainer onClick={onClick}>
        <UserAvatar
          src={recipient?.photoURL}
          name={recipientName}
          email={recipientEmail}
          size="medium"
          margin="0"
        />

        <ConversationInfo>
          <RecipientName>{recipientName}</RecipientName>
          {lastMessage && <LastMessage>{lastMessage}</LastMessage>}
        </ConversationInfo>

        <ConversationMeta>
          {timestamp && <Timestamp>{timestamp}</Timestamp>}
          {unreadCount > 0 && (
            <UnreadBadge>{unreadCount > 9 ? "9+" : unreadCount}</UnreadBadge>
          )}
        </ConversationMeta>
      </ItemContainer>
    );
  }
);

ConversationItem.displayName = "ConversationItem";

export default ConversationItem;
