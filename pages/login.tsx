import { useState } from "react";
import Button from "@mui/material/Button";
import Head from "next/head";
import styled from "styled-components";
import Image from "next/image";
import WhatsAppLogo from "../assets/whatsapplogo.png";
import { useSignInWithGoogle } from "react-firebase-hooks/auth";
import { auth, db } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { TextField, Typography, Tabs, Tab, Box, Divider } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
      style={{ width: "100%" }}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const generateAvatarUrl = (displayName: string) => {
  const initial = displayName.charAt(0).toUpperCase();
  const colors = [
    "1abc9c",
    "2ecc71",
    "3498db",
    "9b59b6",
    "e74c3c",
    "f1c40f",
    "e67e22",
    "34495e",
    "16a085",
    "27ae60",
  ];

  const colorIndex = Math.floor(Math.random() * colors.length);
  const color = colors[colorIndex];

  return `https://ui-avatars.com/api/?name=${initial}&background=${color}&color=fff&size=200`;
};

const Login = () => {
  const [signInWithGoogle, _user, _loading, _error] = useSignInWithGoogle(auth);
  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError("");
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();

      window.location.href = "/";
    } catch (error) {
      console.error("Lỗi đăng nhập với Google:", error);
      setError("Đã xảy ra lỗi khi đăng nhập với Google. Vui lòng thử lại sau.");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      const userDoc = doc(db, "users", user.email as string);
      const userSnapshot = await getDoc(userDoc);

      if (!userSnapshot.exists() && user.displayName) {
        await setDoc(userDoc, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL || generateAvatarUrl(user.displayName),
          lastSeen: serverTimestamp(),
        });
      }

      window.location.href = "/";
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error);
      if (error.code === "auth/user-not-found") {
        setError(
          "Email này chưa được đăng ký. Vui lòng đăng ký trước khi đăng nhập.",
        );
      } else if (error.code === "auth/wrong-password") {
        setError("Mật khẩu không chính xác");
      } else if (error.code === "auth/too-many-requests") {
        setError("Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau");
      } else if (error.code === "auth/user-disabled") {
        setError("Tài khoản này đã bị vô hiệu hóa");
      } else if (error.code === "auth/invalid-email") {
        setError("Email không hợp lệ");
      } else if (error.code === "auth/network-request-failed") {
        setError(
          "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn.",
        );
      } else {
        setError(
          `Đã xảy ra lỗi khi đăng nhập: ${
            error.message || "Vui lòng thử lại sau."
          }`,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) {
      setError("Vui lòng nhập tên hiển thị");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);

    try {
      const photoURL = generateAvatarUrl(displayName);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName,
        photoURL,
      });

      await setDoc(doc(db, "users", user.email as string), {
        email: user.email,
        displayName,
        photoURL,
        lastSeen: serverTimestamp(),
      });

      setEmail("");
      setPassword("");
      setDisplayName("");
      setConfirmPassword("");

      setTabValue(0);

      alert("Đăng ký thành công! Vui lòng đăng nhập.");
    } catch (error: any) {
      console.error("Lỗi đăng ký:", error);

      if (error.code === "auth/email-already-in-use") {
        try {
          const userDoc = doc(db, "users", email);
          const userSnapshot = await getDoc(userDoc);

          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            console.log("Email đã tồn tại trong Firestore:", userData.email);
            setError(
              `Email này đã được đăng ký bởi ${
                userData.displayName || "người dùng khác"
              }. Bạn có thể thử đăng nhập hoặc sử dụng email khác.`,
            );
          } else {
            console.log(
              "Email tồn tại trong Authentication nhưng không có trong Firestore:",
              email,
            );
            setError(
              "Email này đã được đăng ký nhưng chưa hoàn tất thiết lập. Bạn có thể thử đăng nhập hoặc sử dụng email khác.",
            );
          }
        } catch (checkError) {
          console.error("Lỗi khi kiểm tra Firestore:", checkError);
          setError(
            "Email này đã được đăng ký. Bạn có thể thử đăng nhập hoặc sử dụng email khác.",
          );
        }

        setTabValue(0);

        setPassword("");
      } else if (error.code === "auth/operation-not-allowed") {
        setError(
          "Phương thức đăng ký bằng email/mật khẩu chưa được bật trong Firebase",
        );
      } else if (error.code === "auth/weak-password") {
        setError("Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn");
      } else if (error.code === "auth/invalid-email") {
        setError("Email không hợp lệ");
      } else if (error.code === "auth/network-request-failed") {
        setError(
          "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn.",
        );
      } else {
        setError(
          `Đã xảy ra lỗi khi đăng ký: ${
            error.message || "Vui lòng thử lại sau."
          }`,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#2a2b30] p-4">
      <div className="w-full max-w-md bg-[#2a2b30] rounded-2xl shadow-xl p-8 flex flex-col items-center">
        {/* Logo */}

        {/* Custom Tabs */}
        <div className="w-full flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setTabValue(0)}
            className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${
              tabValue === 0
                ? "border-[#667eea]-500 text-white "
                : "border-transparent text-gray-300 hover:text-gray-300"
            }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => setTabValue(1)}
            className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${
              tabValue === 1
                ? "border-[#667eea]-500 text-white"
                : "border-transparent text-gray-300 hover:text-gray-300"
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Tab Panel Content */}
        <div className="w-full min-h-[320px]">
          <form
            onSubmit={tabValue === 0 ? handleSignIn : handleSignUp}
            className="space-y-4"
          >
            {/* Trường Tên hiển thị (Chỉ hiện khi ở tab Đăng ký) */}
            {tabValue === 1 && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-tight">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#667eea]-500 outline-none transition-all"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-tight">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#667eea]-500 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
              />
            </div>

            {/* Mật khẩu */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-tight">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#667eea]-500 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {/* Xác nhận mật khẩu (Chỉ hiện ở tab Đăng ký) */}
            {tabValue === 1 && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-tight">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  required
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 outline-none transition-all ${
                    password !== confirmPassword && confirmPassword !== ""
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:ring-[#667eea]-500"
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
                {password !== confirmPassword && confirmPassword !== "" && (
                  <p className="text-red-500 text-xs mt-1 italic">
                    Mật khẩu không khớp
                  </p>
                )}
              </div>
            )}

            {/* Thông báo lỗi chung */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-shake">
                <span className="font-bold underline text-xs">Lỗi:</span>{" "}
                {error}
              </div>
            )}

            {/* Nút Submit chính */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#667eea]-600 hover:bg-[#667eea]-700 text-white font-bold rounded-lg shadow-lg shadow-[#667eea]-200 transition-all active:scale-[0.98] disabled:bg-gray-300 disabled:shadow-none mt-4 flex items-center justify-center gap-2"
            >
              {isLoading && <FontAwesomeIcon icon={faCircleNotch} spin />}
              {tabValue === 0
                ? isLoading
                  ? "Login..."
                  : "Login"
                : isLoading
                  ? "Register..."
                  : "Register"}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center my-6">
          <div className="flex-1 h-[1px] bg-gray-200"></div>
          <span className="px-4 text-sm text-gray-400 font-medium">Hoặc</span>
          <div className="flex-1 h-[1px] bg-gray-200"></div>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          className="text-white  hover:text-gray-800 w-full flex items-center justify-center gap-3 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-semibold transition-colors"
        >
          <FontAwesomeIcon icon={faGoogle} />
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
};

export default Login;
