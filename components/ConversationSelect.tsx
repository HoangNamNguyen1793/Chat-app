"use client";

import { useRouter } from "next/router";
import styled from "styled-components";
import { useRecipient } from "../hooks/useRecipient";
import { Conversation } from "../types";
import RecipientAvatar from "./RecipientAvatar";
import { getRecipientName } from "../utils/getRecipientName";
import { isGroupConversation, getGroupDisplayName } from "../utils/groupUtils";
import GroupIcon from "@mui/icons-material/Group";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc } from "firebase/firestore";
import { db } from "../config/firebase";

const StyledContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 15px;
  word-break: break-all;

  :hover {
    background-color: #e9eaeb;
  }
`;

const StyledGroupIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e0e0e0;
  margin-right: 12px;
`;

const ConversationSelect = ({
  id,
  conversationUsers,
}: {
  id: string;
  conversationUsers: Conversation["users"];
}) => {
  const [conversationSnapshot] = useDocument(doc(db, "conversations", id));
  const conversationData = conversationSnapshot?.data() as
    | Conversation
    | undefined;
  const { recipient, recipientEmail, recipientName } =
    useRecipient(conversationUsers);

  const router = useRouter();

  const onSelectConversation = () => {
    router.push(`/conversations/${id}`);
  };

  const isGroup = conversationData
    ? isGroupConversation(conversationData)
    : false;
  const displayName =
    isGroup && conversationData
      ? getGroupDisplayName(conversationData)
      : recipientName;

  return (
    <StyledContainer onClick={onSelectConversation}>
      {isGroup ? (
        <StyledGroupIconContainer>
          <GroupIcon style={{ color: "#666", fontSize: "20px" }} />
        </StyledGroupIconContainer>
      ) : (
        <RecipientAvatar
          recipient={recipient}
          recipientEmail={recipientEmail}
          recipientName={recipientName}
        />
      )}
      <span>{displayName}</span>
    </StyledContainer>
  );
};

export default ConversationSelect;
