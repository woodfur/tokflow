import { useState } from 'react';

const useImageUpload = () => {
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const validateImageFile = (file, type) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return false;
    }

    // Check file size based on type
    const maxSize = type === 'logo' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for logo, 10MB for banner
    if (file.size > maxSize) {
      const sizeLimit = type === 'logo' ? '5MB' : '10MB';
      alert(`File size too large. Please select a ${type} under ${sizeLimit}.`);
      return false;
    }

    // Check image dimensions (optional)
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = function() {
        URL.revokeObjectURL(img.src);
        
        if (type === 'logo') {
          // Logo should be square or close to square
          const aspectRatio = this.width / this.height;
          if (aspectRatio < 0.5 || aspectRatio > 2) {
            alert('Logo should have a square or rectangular aspect ratio.');
            resolve(false);
            return;
          }
        } else if (type === 'banner') {
          // Banner should be wide
          const aspectRatio = this.width / this.height;
          if (aspectRatio < 2) {
            alert('Banner should have a wide aspect ratio (at least 2:1).');
            resolve(false);
            return;
          }
        }
        
        resolve(true);
      };
      
      img.onerror = function() {
        alert('Invalid image file. Please select a different file.');
        URL.revokeObjectURL(img.src);
        resolve(false);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const onSelectLogo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isValid = await validateImageFile(file, 'logo');
    if (!isValid) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      if (readerEvent.target?.result) {
        setLogoFile(file);
        setLogoPreview(readerEvent.target.result);
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
    };
    
    reader.readAsDataURL(file);
  };

  const onSelectBanner = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isValid = await validateImageFile(file, 'banner');
    if (!isValid) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      if (readerEvent.target?.result) {
        setBannerFile(file);
        setBannerPreview(readerEvent.target.result);
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
    };
    
    reader.readAsDataURL(file);
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
  };

  const clearBanner = () => {
    setBannerFile(null);
    setBannerPreview('');
  };

  const resetAll = () => {
    clearLogo();
    clearBanner();
    setIsUploading(false);
  };

  return {
    logoFile,
    bannerFile,
    logoPreview,
    bannerPreview,
    isUploading,
    setIsUploading,
    onSelectLogo,
    onSelectBanner,
    clearLogo,
    clearBanner,
    resetAll
  };
};

export default useImageUpload;