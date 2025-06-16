import { doc, getDoc, getDocs, Timestamp } from "firebase/firestore";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import styled from "styled-components";
import ConversationScreen from "../../components/chat/ConversationScreen";
import Sidebar from "../../components/layout/Sidebar";
import { auth, db } from "../../config/firebase";
import type { Conversation, IMessage } from "../../types";
import {
  generateQueryGetMessages,
  transformMessage,
} from "../../utils/getMessagesInConversation";
import { getRecipientEmail } from "../../utils/getRecipientEmail";

interface Props {
  conversation: Conversation;
  messages: IMessage[];
}

const StyledContainer = styled.div`
  display: flex;
`;

const StyledConversationContainer = styled.div`
  flex-grow: 1;
  overflow: scroll;
  height: 100vh;

  ::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const Conversation = ({ conversation, messages }: Props) => {
  const [loggedInUser, _loading, _error] = useAuthState(auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <StyledContainer>
      <Head>
        <title>
          Conversation with{" "}
          {getRecipientEmail(conversation.users, loggedInUser)}
        </title>
      </Head>

      <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />

      <StyledConversationContainer>
        <ConversationScreen conversation={conversation} messages={messages} />
      </StyledConversationContainer>
    </StyledContainer>
  );
};

export default Conversation;

export const getServerSideProps: GetServerSideProps<
  Props,
  { id: string }
> = async (context) => {
  const conversationId = context.params?.id;

  const conversationRef = doc(db, "conversations", conversationId as string);
  const conversationSnapshot = await getDoc(conversationRef);

  const queryMessages = generateQueryGetMessages(conversationId);

  const messagesSnapshot = await getDocs(queryMessages);

  const messages = messagesSnapshot.docs.map((messageDoc) =>
    transformMessage(messageDoc)
  );

  const conversationData = conversationSnapshot.data();
  const transformedConversation: Conversation = {
    users: conversationData?.users ?? [],
    isGroup: conversationData?.isGroup,
    groupName: conversationData?.groupName,
    groupDescription: conversationData?.groupDescription,
    groupImage: conversationData?.groupImage,
    adminUsers: conversationData?.adminUsers,
    createdAt: conversationData?.createdAt
      ? convertFirestoreTimestampToString(conversationData.createdAt)
      : undefined,
    createdBy: conversationData?.createdBy,
    lastActivity: conversationData?.lastActivity
      ? convertFirestoreTimestampToString(conversationData.lastActivity)
      : undefined,
  };

  return {
    props: {
      conversation: transformedConversation,
      messages,
    },
  };
};

export const convertFirestoreTimestampToString = (timestamp: Timestamp) =>
  new Date(timestamp.toDate().getTime()).toLocaleString();
