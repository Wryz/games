'use client'
import { useState, useEffect } from 'react';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Consider it mobile if the screen is small (regardless of touch capability)
      // This handles both actual mobile devices and desktop windows that are very narrow
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isSmallScreen);
    };

    // Check on mount
    checkIsMobile();

    // Check on resize
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};
