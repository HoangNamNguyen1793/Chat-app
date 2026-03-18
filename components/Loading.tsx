"use client";

import styled from "styled-components";
import Image from "next/image";
import WhatsAppLogo from "../assets/whatsapplogo.png";
import CircularProgress from "@mui/material/CircularProgress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";

const Loading = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#2a2b30] z-[999]">
      {/* Logo Wrapper */}

      {/* Circular Progress Replacement */}
      <div className="flex flex-col items-center gap-4">
        <FontAwesomeIcon
          icon={faCircleNotch}
          className="text-4xl text-[#667eea]-500 animate-spin"
        />

        {/* Optional: Thêm dòng chữ nhỏ bên dưới cho chuyên nghiệp */}
        <p className="text-sm font-medium text-gray-400 tracking-widest uppercase animate-pulse">
          Đang tải dữ liệu...
        </p>
      </div>
    </div>
  );
};

export default Loading;
