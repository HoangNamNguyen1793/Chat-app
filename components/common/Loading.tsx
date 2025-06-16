"use client";

import styled from "styled-components";
import Image from "next/image";
import { CircularProgress } from "@mui/material";
import { memo } from "react";

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--background-color, #f0f0f0);
`;

const StyledImageWrapper = styled.div`
  margin-bottom: 50px;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
`;

const LoadingText = styled.p`
  margin-top: 20px;
  color: var(--text-color, #555);
  font-size: 14px;
  text-align: center;
`;

interface LoadingProps {
  text?: string;
  showLogo?: boolean;
}

const Loading = memo(({ text = "Loading...", showLogo = true }: LoadingProps) => {
  return (
    <StyledContainer>
      {showLogo && (
        <StyledImageWrapper>
          <Image
            src="/assets/whatsapplogo.png"
            alt="WhatsApp Logo"
            height={200}
            width={200}
            priority
          />
        </StyledImageWrapper>
      )}
      
      <CircularProgress size={40} sx={{ color: '#25d366' }} />
      {text && <LoadingText>{text}</LoadingText>}
    </StyledContainer>
  );
});

Loading.displayName = 'Loading';

export default Loading;

