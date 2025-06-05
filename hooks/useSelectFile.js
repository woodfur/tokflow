import React, { useState } from "react";

const useSelectFile = () => {
  const [selectedFile, setSelectedFile] = useState();

  const onSelectedFile = (event) => {
    const reader = new FileReader();
    const file = event.target.files?.[0];

    if (file) {
      // Check if file is a video
      if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file.');
        return;
      }

      // Check file size (limit to 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB in bytes
      if (file.size > maxSize) {
        alert('File size too large. Please select a video under 100MB.');
        return;
      }

      // Check video duration (optional - requires video element)
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        // Check if video is longer than 10 minutes (600 seconds)
        if (video.duration > 600) {
          alert('Video duration too long. Please select a video under 10 minutes.');
          return;
        }
        // If all checks pass, read the file
        reader.readAsDataURL(file);
      };
      
      video.onerror = function() {
        alert('Invalid video file. Please select a different file.');
        window.URL.revokeObjectURL(video.src);
      };
      
      video.src = URL.createObjectURL(file);
    }

    reader.onload = (readerEvent) => {
      if (readerEvent.target?.result) {
        setSelectedFile(readerEvent.target.result);
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
    };
  };

  return { selectedFile, setSelectedFile, onSelectedFile };
};
export default useSelectFile;
