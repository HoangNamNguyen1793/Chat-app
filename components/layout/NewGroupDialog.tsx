"use client";

import React, { useState, memo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Chip,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";
import * as EmailValidator from "email-validator";
import { auth } from "../../config/firebase";
import Button from "../common/Button";
import { createGroupConversation } from "../../utils/groupUtils";

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
        loggedInUser.email
      );

      showSnackbar("Group created successfully!");

      setTimeout(() => {
        handleClose();

        router.push(`/conversations/${groupId}`).catch((error) => {
          console.error("Navigation error:", error);
          showSnackbar(
            "Group created but navigation failed. Please check your conversations."
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
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Group</DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Group Name */}
              <TextField
                autoFocus
                label="Group Name"
                type="text"
                fullWidth
                variant="outlined"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                disabled={isCreating}
                required
              />

              {/* Group Description */}
              <TextField
                label="Group Description (Optional)"
                type="text"
                fullWidth
                variant="outlined"
                multiline
                rows={2}
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Enter group description"
                disabled={isCreating}
              />

              {/* Add Members Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Add Members
                </Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    label="Member Email"
                    type="email"
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    onKeyPress={handleMemberEmailKeyPress}
                    placeholder="Enter email address"
                    disabled={isCreating}
                  />
                  <IconButton
                    onClick={addMember}
                    disabled={isCreating}
                    color="primary"
                    sx={{
                      backgroundColor: "primary.main",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "primary.dark",
                      },
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Members List */}
              {members.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Group Members ({members.length})
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {members.map((email) => (
                      <Chip
                        key={email}
                        label={email}
                        onDelete={() => removeMember(email)}
                        deleteIcon={<DeleteIcon />}
                        disabled={isCreating}
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ padding: 2, gap: 1 }}>
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isCreating}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={!groupName.trim() || members.length === 0 || isCreating}
            >
              {isCreating ? "Creating..." : "Create Group"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={
            snackbarMessage.includes("successfully") ? "success" : "error"
          }
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
});

NewGroupDialog.displayName = "NewGroupDialog";

export default NewGroupDialog;
