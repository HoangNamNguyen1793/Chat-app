"use client";

import React, { useState, useEffect, memo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Box,
  Typography,
  Chip,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
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
      null
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
      member: GroupMember
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
          currentUserEmail
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
      isCurrentlyAdmin: boolean
    ) => {
      try {
        if (isCurrentlyAdmin) {
          await removeAdminPrivileges(
            conversationId,
            memberEmail,
            currentUserEmail
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
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6">
                Group Members ({members.length})
              </Typography>
              {isCurrentUserAdmin && (
                <IconButton
                  onClick={() => setShowAddMember(!showAddMember)}
                  color="primary"
                  size="small"
                >
                  <PersonAddIcon />
                </IconButton>
              )}
            </Box>
          </DialogTitle>

          <DialogContent>
            {/* Add Member Section */}
            {showAddMember && isCurrentUserAdmin && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  backgroundColor: "grey.50",
                  borderRadius: 1,
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Add New Member
                </Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Email Address"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    onKeyPress={handleAddMemberKeyPress}
                    disabled={isAddingMember}
                    placeholder="Enter email address"
                  />
                  <Button
                    onClick={addNewMember}
                    variant="primary"
                    disabled={!newMemberEmail.trim() || isAddingMember}
                    size="small"
                  >
                    {isAddingMember ? "Adding..." : "Add"}
                  </Button>
                </Box>
              </Box>
            )}

            <Divider sx={{ mb: 2 }} />

            {/* Members List */}
            {loading ? (
              <Box sx={{ textAlign: "center", py: 3 }}>
                <Typography>Loading members...</Typography>
              </Box>
            ) : (
              <List>
                {members.map((member) => {
                  const isCurrentUser = member.email === currentUserEmail;
                  const canManageMember = isCurrentUserAdmin && !isCurrentUser;

                  return (
                    <ListItem key={member.email} divider>
                      <ListItemAvatar>
                        <Avatar src={member.photoURL}>
                          {member.isAdmin ? (
                            <AdminIcon color="primary" />
                          ) : (
                            <PersonIcon />
                          )}
                        </Avatar>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography variant="subtitle2">
                              {member.displayName}
                              {isCurrentUser && " (You)"}
                            </Typography>
                            {member.isAdmin && (
                              <Chip
                                label="Admin"
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={member.email}
                      />

                      {canManageMember && (
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={(e) => handleMenuOpen(e, member)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  );
                })}
              </List>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose} variant="outline">
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Member Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {selectedMember && (
            <>
              <MenuItem
                onClick={() =>
                  toggleAdminStatus(
                    selectedMember.email,
                    selectedMember.isAdmin
                  )
                }
              >
                {selectedMember.isAdmin ? "Remove Admin" : "Make Admin"}
              </MenuItem>
              <MenuItem
                onClick={() => removeMember(selectedMember.email)}
                sx={{ color: "error.main" }}
              >
                Remove Member
              </MenuItem>
            </>
          )}
        </Menu>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={5000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={
              snackbarMessage.includes("successfully") ||
              snackbarMessage.includes("now an admin")
                ? "success"
                : "error"
            }
            variant="filled"
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </>
    );
  }
);

GroupMembersDialog.displayName = "GroupMembersDialog";

export default GroupMembersDialog;
