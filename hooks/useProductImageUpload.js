import { useState } from 'react';

export const useProductImageUpload = () => {
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateImage = (file) => {
    const errors = [];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      errors.push('File must be an image');
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      errors.push('Image must be less than 10MB');
    }
    
    return errors;
  };

  const selectImages = (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const validPreviews = [];
    const errors = [];

    fileArray.forEach((file, index) => {
      const fileErrors = validateImage(file);
      if (fileErrors.length === 0) {
        validFiles.push(file);
        
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
          validPreviews.push(e.target.result);
          if (validPreviews.length === validFiles.length) {
            setImageFiles(prev => [...prev, ...validFiles]);
            setImagePreviews(prev => [...prev, ...validPreviews]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        errors.push(`File ${index + 1}: ${fileErrors.join(', ')}`);
      }
    });

    if (errors.length > 0) {
      alert('Some files were not added:\n' + errors.join('\n'));
    }
  };

  const selectSingleImage = (file) => {
    const errors = validateImage(file);
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageFiles(prev => [...prev, file]);
      setImagePreviews(prev => [...prev, e.target.result]);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setImageFiles([]);
    setImagePreviews([]);
  };

  const reorderImages = (fromIndex, toIndex) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    
    const [movedFile] = newFiles.splice(fromIndex, 1);
    const [movedPreview] = newPreviews.splice(fromIndex, 1);
    
    newFiles.splice(toIndex, 0, movedFile);
    newPreviews.splice(toIndex, 0, movedPreview);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  return {
    imageFiles,
    imagePreviews,
    isUploading,
    setIsUploading,
    selectImages,
    selectSingleImage,
    removeImage,
    clearAllImages,
    reorderImages
  };
};