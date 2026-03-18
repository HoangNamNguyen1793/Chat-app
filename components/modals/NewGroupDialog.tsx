"use client";

import React, { useState, memo } from "react";

import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";
import * as EmailValidator from "email-validator";
import { auth } from "../../config/firebase";
import Button from "../common/Button";
import { createGroupConversation } from "../../utils/groupUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faUsers, faXmark } from "@fortawesome/free-solid-svg-icons";

interface NewGroupDialogProps {
  open: boolean;
  onClose: () => void;
}

const NewGroupDialog = memo(({ open, onClose }: NewGroupDialogProps) => {
  const [loggedInUser] = useAuthState(auth);
  const router = useRouter();

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleClose = () => {
    setGroupName("");
    setGroupDescription("");
    setMemberEmail("");
    setMembers([]);
    onClose();
  };

  const addMember = () => {
    const email = memberEmail.trim().toLowerCase();

    if (!email) {
      showSnackbar("Please enter an email address");
      return;
    }

    if (!EmailValidator.validate(email)) {
      showSnackbar("Please enter a valid email address");
      return;
    }

    if (email === loggedInUser?.email) {
      showSnackbar("You don't need to add yourself to the group");
      return;
    }

    if (members.includes(email)) {
      showSnackbar("This user is already added to the group");
      return;
    }

    setMembers([...members, email]);
    setMemberEmail("");
  };

  const removeMember = (emailToRemove: string) => {
    setMembers(members.filter((email) => email !== emailToRemove));
  };

  const createGroup = async () => {
    const trimmedGroupName = groupName.trim();

    if (!trimmedGroupName) {
      showSnackbar("Please enter a group name");
      return;
    }

    if (trimmedGroupName.length < 2) {
      showSnackbar("Group name must be at least 2 characters long");
      return;
    }

    if (trimmedGroupName.length > 50) {
      showSnackbar("Group name must be less than 50 characters");
      return;
    }

    const MAX_MEMBERS = 100; // Define reasonable limit
    if (members.length > MAX_MEMBERS) {
      showSnackbar(`Groups can have at most ${MAX_MEMBERS} members`);
      return;
    }

    if (members.length === 0) {
      showSnackbar("Please add at least one member to the group");
      return;
    }

    if (!loggedInUser?.email) {
      showSnackbar("You must be logged in to create a group");
      return;
    }

    setIsCreating(true);

    try {
      const groupId = await createGroupConversation(
        groupName,
        groupDescription,
        members,
        loggedInUser.email,
      );

      showSnackbar("Group created successfully!");

      setTimeout(() => {
        handleClose();

        router.push(`/conversations/${groupId}`).catch((error) => {
          console.error("Navigation error:", error);
          showSnackbar(
            "Group created but navigation failed. Please check your conversations.",
          );
        });
      }, 1000);
    } catch (error) {
      console.error("Error creating group:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create group. Please try again.";
      showSnackbar(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGroup();
  };

  const handleMemberEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addMember();
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#2a2b30] backdrop-blur-sm animate-in fade-in duration-300"
            onClick={handleClose}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-[#313338] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="text-[#667eea]" />
                Create New Group
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Group Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400">
                    Group Name
                  </label>
                  <input
                    autoFocus
                    required
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    disabled={isCreating}
                    className="w-full bg-[#1e1f22] border border-black/20 rounded-lg p-3 text-gray-200 outline-none focus:border-[#667eea] transition-all disabled:opacity-50"
                  />
                </div>

                {/* Group Description */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="What's this group about?"
                    disabled={isCreating}
                    className="w-full bg-[#1e1f22] border border-black/20 rounded-lg p-3 text-gray-200 outline-none focus:border-[#667eea] transition-all disabled:opacity-50 resize-none"
                  />
                </div>

                {/* Add Members Section */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400">
                    Add Members
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      onKeyPress={handleMemberEmailKeyPress}
                      placeholder="Member's email address"
                      disabled={isCreating}
                      className="flex-1 bg-[#1e1f22] border border-black/20 rounded-lg p-2 text-sm text-gray-200 outline-none focus:border-[#667eea] transition-all"
                    />
                    <button
                      type="button"
                      onClick={addMember}
                      disabled={isCreating}
                      className="bg-[#667eea] hover:bg-[#5a6fd6] text-white w-10 h-10 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                </div>

                {/* Members List (Chips) */}
                {members.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-gray-500 italic">
                      Group Members ({members.length})
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                      {members.map((email) => (
                        <div
                          key={email}
                          className="flex items-center gap-2 bg-[#667eea]/10 border border-[#667eea]/30 text-[#667eea] px-3 py-1 rounded-full text-xs animate-in zoom-in-75"
                        >
                          <span className="truncate max-w-[150px]">
                            {email}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeMember(email)}
                            disabled={isCreating}
                            className="hover:text-red-400 transition-colors"
                          >
                            <FontAwesomeIcon icon={faXmark} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isCreating}
                    className="px-6 py-2 rounded-xl font-medium text-gray-300 hover:bg-[#2a2b30]/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !groupName.trim() || members.length === 0 || isCreating
                    }
                    className="px-6 py-2 rounded-xl font-medium bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isCreating ? "Creating..." : "Create Group"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

NewGroupDialog.displayName = "NewGroupDialog";

export default NewGroupDialog;
