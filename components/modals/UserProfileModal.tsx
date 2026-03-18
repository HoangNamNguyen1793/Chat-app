import React, { useState, useRef, useCallback } from "react";
import styled from "styled-components";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { User } from "firebase/auth";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { auth } from "../../config/firebase";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import {
  faCamera,
  faCircleNotch,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null | undefined;
  showSnackbar: (message: string) => void;
}

function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return Promise.reject("Không thể tạo canvas context");
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Không thể tạo blob từ canvas"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.95,
    );
  });
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  open,
  onClose,
  user,
  showSnackbar,
}) => {
  const [newAvatar, setNewAvatar] = useState<Blob | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
        setIsCropDialogOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, 1));
    },
    [],
  );

  const handleCropComplete = (crop: PixelCrop) => {
    setCompletedCrop(crop);
  };

  const handleCropCancel = () => {
    setIsCropDialogOpen(false);
    setImageSrc(null);
  };

  const handleCropConfirm = async () => {
    if (imgRef.current && completedCrop) {
      try {
        const croppedImg = await getCroppedImg(imgRef.current, completedCrop);
        const previewUrl = URL.createObjectURL(croppedImg);
        setNewAvatar(croppedImg);
        setNewAvatarPreview(previewUrl);
        setIsCropDialogOpen(false);
      } catch (error) {
        console.error("Lỗi khi cắt ảnh:", error);
        showSnackbar("Có lỗi xảy ra khi xử lý ảnh");
      }
    }
  };

  const handleUpdateAvatar = async () => {
    if (!newAvatar || !user) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", newAvatar);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Lỗi khi tải ảnh lên Cloudinary");
      }

      const data = await response.json();
      const cloudinaryUrl = data.url;

      await updateProfile(user, {
        photoURL: cloudinaryUrl,
      });

      await setDoc(
        doc(db, "users", user.email as string),
        {
          photoURL: cloudinaryUrl,
          lastSeen: serverTimestamp(),
        },
        { merge: true },
      );

      showSnackbar("Cập nhật avatar thành công");
      setNewAvatar(null);
      setNewAvatarPreview(null);
      onClose();
    } catch (error) {
      console.error("Lỗi cập nhật avatar:", error);
      showSnackbar("Có lỗi xảy ra khi cập nhật avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;

    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (!currentPassword) {
      setError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    setIsChangingPassword(true);

    try {
      const credential = EmailAuthProvider.credential(
        user.email as string,
        currentPassword,
      );

      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, password);

      showSnackbar("Cập nhật mật khẩu thành công");
      setPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setActiveTab("profile");
    } catch (error: any) {
      console.error("Lỗi cập nhật mật khẩu:", error);
      if (error.code === "auth/wrong-password") {
        setError("Mật khẩu hiện tại không chính xác");
      } else {
        setError("Có lỗi xảy ra khi cập nhật mật khẩu");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-black/70 rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-6 flex flex-col items-center">
            {/* Loading Overlay khi đang upload */}
            {isUploading && (
              <div className="absolute inset-0 z-10 bg-black/70 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faCircleNotch}
                  spin
                  size="2xl"
                  className="text-[#667eea]-600"
                />
              </div>
            )}

            {/* Tabs Menu */}
            <div className="w-full flex gap-2 mb-6 p-1 bg-[#1a1b1e] rounded-lg">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 ${
                  activeTab === "profile"
                    ? "bg-[#667eea] text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-[#2a2b30]"
                }`}
              >
                Thông tin cá nhân
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 ${
                  activeTab === "password"
                    ? "bg-[#667eea] text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-[#2a2b30]"
                }`}
              >
                Đổi mật khẩu
              </button>
            </div>
            {/* Content: Profile Tab */}
            {activeTab === "profile" && (
              <div className="w-full flex flex-col items-center">
                {/* Avatar Section */}
                <div
                  className="relative group cursor-pointer"
                  onClick={handleAvatarClick}
                >
                  <img
                    src={
                      newAvatarPreview ||
                      user?.photoURL ||
                      "/default-avatar.png"
                    }
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-lg group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FontAwesomeIcon
                      icon={faCamera}
                      className="text-white text-2xl"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-400 mt-2 mb-4 italic">
                  Nhấp vào ảnh để thay đổi
                </p>

                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                />

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-200">
                    {user?.displayName}
                  </h2>
                  <p className="text-gray-500">{user?.email}</p>
                </div>

                <div className="w-full space-y-2">
                  {newAvatar && (
                    <button
                      onClick={handleUpdateAvatar}
                      disabled={isUploading}
                      className="w-full bg-[#667eea]-600 hover:bg-[#667eea]-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:bg-[#667eea]-300"
                    >
                      {isUploading ? "Đang cập nhật..." : "Cập nhật avatar"}
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-full border border-gray-300 text-gray-300 hover:text-gray-800 font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}

            {/* Content: Password Tab */}
            {activeTab === "password" && (
              <div className="w-full space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#667eea]-500 outline-none"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#667eea]-500 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    className={`w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 outline-none ${
                      password !== confirmPassword && confirmPassword !== ""
                        ? "border-red-500 focus:ring-red-200"
                        : "focus:ring-[#667eea]-500"
                    }`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {password !== confirmPassword && confirmPassword !== "" && (
                    <p className="text-red-500 text-xs mt-1">
                      Mật khẩu không khớp
                    </p>
                  )}
                </div>

                {error && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-center gap-2">
                    <FontAwesomeIcon icon={faExclamationCircle} /> {error}
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <button
                    onClick={handleUpdatePassword}
                    disabled={isChangingPassword}
                    className="w-full bg-[#667eea]-600 hover:bg-[#667eea]-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:bg-[#667eea]-300"
                  >
                    {isChangingPassword
                      ? "Đang cập nhật..."
                      : "Cập nhật mật khẩu"}
                  </button>
                  <button
                    onClick={() => setActiveTab("profile")}
                    className="w-full text-[#667eea]-600 font-medium py-2 hover:underline"
                  >
                    Quay lại
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {isCropDialogOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#2a2b30] rounded-lg max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">
                Cắt ảnh đại diện
              </h3>
            </div>

            <div className="p-4 flex justify-center bg-gray-100 max-h-[60vh] overflow-auto">
              {imageSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={handleCropComplete}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imageSrc}
                    className="max-w-full"
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              )}
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
              <button
                onClick={handleCropCancel}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCropConfirm}
                className="px-4 py-2 bg-[#667eea]-600 text-white rounded-md hover:bg-[#667eea]-700 transition-colors shadow-md"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfileModal;
