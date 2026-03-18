"use client";

import styled from "styled-components";
import Image from "next/image";
import { CircularProgress } from "@mui/material";
import { memo } from "react";

interface LoadingProps {
  text?: string;
  showLogo?: boolean;
}

const Loading = memo(
  ({ text = "Loading...", showLogo = true }: LoadingProps) => {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#111214]">
        {/* Logo Wrapper */}
        {showLogo && (
          <div className="mb-10 animate-pulse">
            <Image
              src="/assets/whatsapplogo.png"
              alt="WhatsApp Logo"
              height={200}
              width={200}
              priority
              className="object-contain"
            />
          </div>
        )}

        {/* Custom Loading Spinner (Thay thế MUI CircularProgress) */}
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#25d366]/20 border-t-[#25d366] rounded-full animate-spin"></div>
        </div>

        {/* Loading Text */}
        {text && (
          <p className="mt-6 text-gray-400 text-sm font-medium tracking-wide animate-bounce">
            {text}
          </p>
        )}
      </div>
    );
  },
);

Loading.displayName = "Loading";

export default Loading;
