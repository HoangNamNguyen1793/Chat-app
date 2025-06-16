import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { Conversation, GroupMember } from "../types";
import * as EmailValidator from "email-validator";

export const createGroupConversation = async (
  groupName: string,
  groupDescription: string,
  initialMembers: string[],
  creatorEmail: string
): Promise<string> => {
  if (!groupName.trim()) {
    throw new Error("Group name is required");
  }

  if (initialMembers.length === 0) {
    throw new Error("At least one member is required");
  }

  const invalidEmails = initialMembers.filter(
    (email) => !EmailValidator.validate(email)
  );
  if (invalidEmails.length > 0) {
    throw new Error(`Invalid email addresses: ${invalidEmails.join(", ")}`);
  }

  const uniqueMembers = Array.from(new Set([creatorEmail, ...initialMembers]));

  try {
    const groupData: Conversation = {
      users: uniqueMembers,
      isGroup: true,
      groupName: groupName.trim(),
      groupDescription: groupDescription.trim(),
      adminUsers: [creatorEmail],
      createdAt: serverTimestamp() as any,
      createdBy: creatorEmail,
      lastActivity: serverTimestamp() as any,
    };

    const docRef = await addDoc(collection(db, "conversations"), groupData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating group:", error);
    throw new Error("Failed to create group. Please try again.");
  }
};

export const addMembersToGroup = async (
  conversationId: string,
  newMembers: string[],
  currentUserEmail: string
): Promise<void> => {
  if (!conversationId || !newMembers.length) {
    throw new Error("Conversation ID and new members are required");
  }

  const invalidEmails = newMembers.filter(
    (email) => !EmailValidator.validate(email)
  );
  if (invalidEmails.length > 0) {
    throw new Error(`Invalid email addresses: ${invalidEmails.join(", ")}`);
  }

  try {
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      throw new Error("Group not found");
    }

    const conversation = conversationSnap.data() as Conversation;

    if (!conversation.adminUsers?.includes(currentUserEmail)) {
      throw new Error("Only administrators can add members");
    }

    const existingMembers = conversation.users || [];
    const membersToAdd = newMembers.filter(
      (email) => !existingMembers.includes(email)
    );

    if (membersToAdd.length === 0) {
      throw new Error("All specified users are already members of this group");
    }

    await updateDoc(conversationRef, {
      users: arrayUnion(...membersToAdd),
      lastActivity: serverTimestamp(),
    });

    const systemMessage = {
      conversation_id: conversationId,
      text: `${currentUserEmail} added ${membersToAdd.join(", ")} to the group`,
      sent_at: serverTimestamp(),
      user: "system",
      isSystemMessage: true,
    };

    await addDoc(collection(db, "messages"), systemMessage);
  } catch (error) {
    console.error("Error adding members:", error);
    throw error;
  }
};

export const removeMemberFromGroup = async (
  conversationId: string,
  memberEmail: string,
  currentUserEmail: string
): Promise<void> => {
  if (!conversationId || !memberEmail) {
    throw new Error("Conversation ID and member email are required");
  }

  try {
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      throw new Error("Group not found");
    }

    const conversation = conversationSnap.data() as Conversation;

    const isAdmin = conversation.adminUsers?.includes(currentUserEmail);
    const isRemovingSelf = memberEmail === currentUserEmail;

    if (!isAdmin && !isRemovingSelf) {
      throw new Error("Only administrators can remove members");
    }

    if (!conversation.users?.includes(memberEmail)) {
      throw new Error("User is not a member of this group");
    }

    if (
      conversation.adminUsers?.includes(memberEmail) &&
      conversation.adminUsers.length === 1
    ) {
      throw new Error("Cannot remove the last administrator");
    }

    await updateDoc(conversationRef, {
      users: arrayRemove(memberEmail),
      adminUsers: arrayRemove(memberEmail),
      lastActivity: serverTimestamp(),
    });

    const action = isRemovingSelf ? "left" : "was removed from";
    const systemMessage = {
      conversation_id: conversationId,
      text: `${memberEmail} ${action} the group`,
      sent_at: serverTimestamp(),
      user: "system",
      isSystemMessage: true,
    };

    await addDoc(collection(db, "messages"), systemMessage);
  } catch (error) {
    console.error("Error removing member:", error);
    throw error;
  }
};

export const makeUserAdmin = async (
  conversationId: string,
  userEmail: string,
  currentUserEmail: string
): Promise<void> => {
  if (!conversationId || !userEmail) {
    throw new Error("Conversation ID and user email are required");
  }

  try {
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      throw new Error("Group not found");
    }

    const conversation = conversationSnap.data() as Conversation;

    if (!conversation.adminUsers?.includes(currentUserEmail)) {
      throw new Error("Only administrators can make other users admin");
    }

    if (!conversation.users?.includes(userEmail)) {
      throw new Error("User is not a member of this group");
    }

    if (conversation.adminUsers?.includes(userEmail)) {
      throw new Error("User is already an administrator");
    }

    await updateDoc(conversationRef, {
      adminUsers: arrayUnion(userEmail),
      lastActivity: serverTimestamp(),
    });

    const systemMessage = {
      conversation_id: conversationId,
      text: `${userEmail} is now an administrator`,
      sent_at: serverTimestamp(),
      user: "system",
      isSystemMessage: true,
    };

    await addDoc(collection(db, "messages"), systemMessage);
  } catch (error) {
    console.error("Error making user admin:", error);
    throw error;
  }
};

export const removeAdminPrivileges = async (
  conversationId: string,
  userEmail: string,
  currentUserEmail: string
): Promise<void> => {
  if (!conversationId || !userEmail) {
    throw new Error("Conversation ID and user email are required");
  }

  try {
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      throw new Error("Group not found");
    }

    const conversation = conversationSnap.data() as Conversation;

    if (!conversation.adminUsers?.includes(currentUserEmail)) {
      throw new Error("Only administrators can remove admin privileges");
    }

    if (conversation.adminUsers?.length === 1) {
      throw new Error("Cannot remove the last administrator");
    }

    if (!conversation.adminUsers?.includes(userEmail)) {
      throw new Error("User is not an administrator");
    }

    await updateDoc(conversationRef, {
      adminUsers: arrayRemove(userEmail),
      lastActivity: serverTimestamp(),
    });

    const systemMessage = {
      conversation_id: conversationId,
      text: `${userEmail} is no longer an administrator`,
      sent_at: serverTimestamp(),
      user: "system",
      isSystemMessage: true,
    };

    await addDoc(collection(db, "messages"), systemMessage);
  } catch (error) {
    console.error("Error removing admin privileges:", error);
    throw error;
  }
};

export const updateGroupInfo = async (
  conversationId: string,
  updates: { groupName?: string; groupDescription?: string },
  currentUserEmail: string
): Promise<void> => {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  try {
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      throw new Error("Group not found");
    }

    const conversation = conversationSnap.data() as Conversation;

    if (!conversation.adminUsers?.includes(currentUserEmail)) {
      throw new Error("Only administrators can update group information");
    }

    const updateData: any = {
      lastActivity: serverTimestamp(),
    };

    if (updates.groupName !== undefined) {
      if (!updates.groupName.trim()) {
        throw new Error("Group name cannot be empty");
      }
      updateData.groupName = updates.groupName.trim();
    }

    if (updates.groupDescription !== undefined) {
      updateData.groupDescription = updates.groupDescription.trim();
    }

    await updateDoc(conversationRef, updateData);

    let changeMessage = "";
    if (updates.groupName) {
      changeMessage += `Group name changed to "${updates.groupName}"`;
    }
    if (updates.groupDescription) {
      if (changeMessage) changeMessage += " and ";
      changeMessage += `description updated`;
    }

    if (changeMessage) {
      const systemMessage = {
        conversation_id: conversationId,
        text: `${currentUserEmail} ${changeMessage}`,
        sent_at: serverTimestamp(),
        user: "system",
        isSystemMessage: true,
      };

      await addDoc(collection(db, "messages"), systemMessage);
    }
  } catch (error) {
    console.error("Error updating group info:", error);
    throw error;
  }
};

export const getGroupMembers = async (
  conversationId: string
): Promise<GroupMember[]> => {
  try {
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      throw new Error("Group not found");
    }

    const conversation = conversationSnap.data() as Conversation;
    const memberEmails = conversation.users || [];
    const adminEmails = conversation.adminUsers || [];

    const members: GroupMember[] = [];

    for (const email of memberEmails) {
      const userQuery = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const userSnap = await getDocs(userQuery);

      let displayName = email.split("@")[0];
      let photoURL = "";

      if (!userSnap.empty) {
        const userData = userSnap.docs[0].data();
        displayName = userData.displayName || displayName;
        photoURL = userData.photoURL || "";
      }

      members.push({
        email,
        displayName,
        photoURL,
        isAdmin: adminEmails.includes(email),
        joinedAt: conversation.createdAt || (serverTimestamp() as any),
        addedBy: conversation.createdBy,
      });
    }

    return members;
  } catch (error) {
    console.error("Error getting group members:", error);
    throw error;
  }
};

export const isGroupConversation = (conversation: Conversation): boolean => {
  return conversation.isGroup === true;
};

export const isUserAdmin = (
  conversation: Conversation,
  userEmail: string
): boolean => {
  return conversation.adminUsers?.includes(userEmail) || false;
};

export const getGroupDisplayName = (conversation: Conversation): string => {
  if (conversation.isGroup && conversation.groupName) {
    return conversation.groupName;
  }
  return "Unnamed Group";
};
