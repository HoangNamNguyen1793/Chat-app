import React from "react";
import styled from "styled-components";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt,
  faFileExcel,
  faFilePdf,
  faFileWord,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

interface FileReviewProps {
  selectedFiles: File[];
  filePreviews: { file: File; preview: string }[];
  uploadProgress: { [key: string]: number };
  isUploading: boolean;
  clearSelectedFiles: () => void;
  removeFile: (index: number) => void;
}

const getFileIconProps = (type: any) => {
  if (type.includes("pdf")) return { icon: faFilePdf, color: "text-red-500" };
  if (type.includes("word") || type.includes("doc"))
    return { icon: faFileWord, color: "text-[#667eea]-600" };
  if (type.includes("excel") || type.includes("sheet"))
    return { icon: faFileExcel, color: "text-[#667eea]-600" };
  return { icon: faFileAlt, color: "text-gray-400" };
};

const FileReviewComponent: React.FC<FileReviewProps> = ({
  selectedFiles,
  filePreviews,
  uploadProgress,
  isUploading,
  clearSelectedFiles,
  removeFile,
}) => {
  if (selectedFiles.length === 0) return null;

  return (
    <div className="w-full p-4 bg-[#2b2d31] border-b border-white/10">
      {/* Header: Số lượng tệp & Xóa tất cả */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-gray-400">
          {selectedFiles.length} Choosen Files
        </span>
        {selectedFiles.length > 1 && (
          <button
            onClick={clearSelectedFiles}
            className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
            title="Xóa tất cả"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xs block" />
          </button>
        )}
      </div>

      {/* Danh sách file preview */}
      <div className="flex flex-wrap gap-3 max-h-64 overflow-y-auto">
        {filePreviews.map((item, index) => {
          const isImage =
            item.preview !== "non-image" && item.file.type.startsWith("image/");
          const fileIcon = getFileIconProps(item.file.type);

          return (
            <div
              key={index}
              className="relative flex items-center gap-3 p-2 bg-[#2a2b30] border border-white/10 rounded-lg min-w-[200px] max-w-[250px] shadow-sm group"
            >
              {/* Ảnh preview hoặc Icon file */}
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded overflow-hidden">
                {isImage ? (
                  <img
                    src={item.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={fileIcon.icon}
                    className={`text-3xl ${fileIcon.color}`}
                  />
                )}
              </div>

              {/* Thông tin file */}
              <div className="flex-1 min-w-0 pr-6">
                <p
                  className="text-sm font-medium text-gray-300 truncate"
                  title={item.file.name}
                >
                  {item.file.name}
                </p>
                <span className="text-[11px] text-gray-400 italic">
                  {(item.file.size / 1024).toFixed(1)} KB
                </span>

                {/* Progress Bar khi đang upload */}
                {isUploading &&
                  uploadProgress[item.file.name] !== undefined && (
                    <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-[#667eea]-500 transition-all duration-300"
                        style={{ width: `${uploadProgress[item.file.name]}%` }}
                      />
                    </div>
                  )}
              </div>

              {/* Nút xóa từng file */}
              <button
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              >
                <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileReviewComponent;
