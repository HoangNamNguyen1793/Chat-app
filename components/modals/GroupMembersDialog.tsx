"use client";

import React, { useState, useEffect, memo } from "react";

import { useAuthState } from "react-firebase-hooks/auth";
import * as EmailValidator from "email-validator";
import { auth } from "../../config/firebase";
import Button from "../common/Button";
import {
  getGroupMembers,
  addMembersToGroup,
  removeMemberFromGroup,
  makeUserAdmin,
  removeAdminPrivileges,
  isUserAdmin,
} from "../../utils/groupUtils";
import { Conversation, GroupMember } from "../../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faEllipsisV,
  faExclamationCircle,
  faTimes,
  faUser,
  faUserPlus,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";

interface GroupMembersDialogProps {
  open: boolean;
  onClose: () => void;
  conversation: Conversation;
  conversationId: string;
}

const GroupMembersDialog = memo(
  ({
    open,
    onClose,
    conversation,
    conversationId,
  }: GroupMembersDialogProps) => {
    const [loggedInUser] = useAuthState(auth);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedMember, setSelectedMember] = useState<GroupMember | null>(
      null,
    );

    const currentUserEmail = loggedInUser?.email || "";
    const isCurrentUserAdmin = isUserAdmin(conversation, currentUserEmail);

    const showSnackbar = (message: string) => {
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    };

    const loadMembers = React.useCallback(async () => {
      try {
        setLoading(true);
        const groupMembers = await getGroupMembers(conversationId);
        setMembers(groupMembers);
      } catch (error) {
        console.error("Error loading members:", error);
        showSnackbar("Failed to load group members");
      } finally {
        setLoading(false);
      }
    }, [conversationId]);

    useEffect(() => {
      if (open) {
        loadMembers();
      }
    }, [open, conversationId, loadMembers]);

    const handleClose = () => {
      setAnchorEl(null);
      setSelectedMember(null);
      setShowAddMember(false);
      setNewMemberEmail("");
      onClose();
    };

    const handleMenuOpen = (
      event: React.MouseEvent<HTMLElement>,
      member: GroupMember,
    ) => {
      setAnchorEl(event.currentTarget);
      setSelectedMember(member);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
      setSelectedMember(null);
    };

    const addNewMember = async () => {
      const email = newMemberEmail.trim().toLowerCase();

      if (!email) {
        showSnackbar("Please enter an email address");
        return;
      }

      if (!EmailValidator.validate(email)) {
        showSnackbar("Please enter a valid email address");
        return;
      }

      if (email === currentUserEmail) {
        showSnackbar("You are already a member of this group");
        return;
      }

      if (members.some((member) => member.email === email)) {
        showSnackbar("This user is already a member of the group");
        return;
      }

      setIsAddingMember(true);

      try {
        await addMembersToGroup(conversationId, [email], currentUserEmail);
        showSnackbar("Member added successfully!");
        setNewMemberEmail("");
        setShowAddMember(false);
        await loadMembers();
      } catch (error) {
        console.error("Error adding member:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to add member";
        showSnackbar(errorMessage);
      } finally {
        setIsAddingMember(false);
      }
    };

    const removeMember = async (memberEmail: string) => {
      try {
        await removeMemberFromGroup(
          conversationId,
          memberEmail,
          currentUserEmail,
        );
        showSnackbar("Member removed successfully!");
        await loadMembers();
      } catch (error) {
        console.error("Error removing member:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to remove member";
        showSnackbar(errorMessage);
      }
      handleMenuClose();
    };

    const toggleAdminStatus = async (
      memberEmail: string,
      isCurrentlyAdmin: boolean,
    ) => {
      try {
        if (isCurrentlyAdmin) {
          await removeAdminPrivileges(
            conversationId,
            memberEmail,
            currentUserEmail,
          );
          showSnackbar("Admin privileges removed");
        } else {
          await makeUserAdmin(conversationId, memberEmail, currentUserEmail);
          showSnackbar("User is now an admin");
        }
        await loadMembers();
      } catch (error) {
        console.error("Error toggling admin status:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to update admin status";
        showSnackbar(errorMessage);
      }
      handleMenuClose();
    };

    const handleAddMemberKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addNewMember();
      }
    };

    return (
      <>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-[#2a2b30] rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
              {/* Dialog Title */}
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Group Members ({members.length})
                </h3>
                {isCurrentUserAdmin && (
                  <button
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="p-2 text-[#667eea]-600 hover:bg-[#667eea]-50 rounded-full transition-colors"
                  >
                    <FontAwesomeIcon icon={faUserPlus} />
                  </button>
                )}
              </div>

              {/* Dialog Content */}
              <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
                {/* Add Member Section */}
                {showAddMember && isCurrentUserAdmin && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Add New Member
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#667eea]-500 disabled:bg-gray-200"
                        placeholder="Enter email address"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        onKeyPress={handleAddMemberKeyPress}
                        disabled={isAddingMember}
                      />
                      <button
                        onClick={addNewMember}
                        disabled={!newMemberEmail.trim() || isAddingMember}
                        className="px-4 py-2 bg-[#667eea]-600 text-white text-sm font-medium rounded-md hover:bg-[#667eea]-700 disabled:bg-[#667eea]-300 transition-colors"
                      >
                        {isAddingMember ? "Adding..." : "Add"}
                      </button>
                    </div>
                  </div>
                )}

                <hr className="mb-4 border-gray-200" />

                {/* Members List */}
                {loading ? (
                  <div className="text-center py-6 text-gray-500">
                    <p>Loading members...</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {members.map((member) => {
                      const isCurrentUser = member.email === currentUserEmail;
                      const canManageMember =
                        isCurrentUserAdmin && !isCurrentUser;

                      return (
                        <li
                          key={member.email}
                          className="py-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar Replacement */}
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {member.photoURL ? (
                                <img
                                  src={member.photoURL}
                                  alt={member.displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FontAwesomeIcon
                                  icon={member.isAdmin ? faUserShield : faUser}
                                  className={
                                    member.isAdmin
                                      ? "text-[#667eea]-500"
                                      : "text-gray-400"
                                  }
                                />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900">
                                  {member.displayName}
                                  {isCurrentUser && (
                                    <span className="text-gray-500 font-normal">
                                      {" "}
                                      (You)
                                    </span>
                                  )}
                                </p>
                                {member.isAdmin && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#667eea]-600 border border-[#667eea]-600 rounded-full">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {member.email}
                              </p>
                            </div>
                          </div>

                          {canManageMember && (
                            <button
                              onClick={(e) => handleMenuOpen(e, member)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <FontAwesomeIcon icon={faEllipsisV} />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Dialog Actions */}
              <div className="px-6 py-4 border-t flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Member Actions Menu */}
        {Boolean(anchorEl) && (
          <>
            {/* Overlay để đóng menu khi click ra ngoài */}
            <div className="fixed inset-0 z-[60]" onClick={handleMenuClose} />

            <div
              className="fixed z-[70] min-w-[150px] bg-[#2a2b30] rounded-md shadow-lg border border-gray-200 py-1"
              style={{
                top: anchorEl?.getBoundingClientRect().bottom! + 5,
                left: anchorEl?.getBoundingClientRect().left! - 100, // Căn chỉnh tùy ý
              }}
            >
              {selectedMember && (
                <>
                  <button
                    onClick={() => {
                      toggleAdminStatus(
                        selectedMember.email,
                        selectedMember.isAdmin,
                      );
                      handleMenuClose();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {selectedMember.isAdmin ? "Remove Admin" : "Make Admin"}
                  </button>

                  <button
                    onClick={() => {
                      removeMember(selectedMember.email);
                      handleMenuClose();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    Remove Member
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* Snackbar / Toast Notification */}
        <div
          className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 transform ${
            snackbarOpen
              ? "translate-y-0 opacity-100"
              : "translate-y-10 opacity-0 pointer-events-none"
          }`}
        >
          {snackbarOpen && (
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl text-white min-w-[300px] ${
                snackbarMessage.includes("successfully") ||
                snackbarMessage.includes("now an admin")
                  ? "bg-[#667eea]-600"
                  : "bg-red-600"
              }`}
            >
              {/* Icon dựa trên loại thông báo */}
              <FontAwesomeIcon
                icon={
                  snackbarMessage.includes("successfully")
                    ? faCheckCircle
                    : faExclamationCircle
                }
                className="text-lg"
              />

              <span className="flex-1 text-sm font-medium">
                {snackbarMessage}
              </span>

              {/* Nút Close */}
              <button
                onClick={() => setSnackbarOpen(false)}
                className="ml-2 hover:bg-[#2a2b30]/20 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} size="xs" />
              </button>
            </div>
          )}
        </div>
      </>
    );
  },
);

GroupMembersDialog.displayName = "GroupMembersDialog";

export default GroupMembersDialog;
