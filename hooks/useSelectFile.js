import React, { useState } from "react";

const useSelectFile = () => {
  const [selectedFile, setSelectedFile] = useState();

  const onSelectedFile = (event) => {
    const reader = new FileReader();
    const file = event.target.files?.[0];

    if (file) {
      // Check if file is a video
      if (file.type.startsWith('video/')) {
        reader.readAsDataURL(file);
      } else {
        alert('Please select a valid video file.');
        return;
      }
    }

    reader.onload = (readerEvent) => {
      if (readerEvent.target?.result) {
        setSelectedFile(readerEvent.target.result);
      }
    };
  };

  return { selectedFile, setSelectedFile, onSelectedFile };
};
export default useSelectFile;
