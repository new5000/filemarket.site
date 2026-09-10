import { useState, useEffect, useRef } from 'react';

export function useScrollDirection() {
  const [isVisible, setIsVisible] = useState(true);
  const prevOffset = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScroll = () => {
      const currentOffset = window.pageYOffset || document.documentElement.scrollTop;

      // Always visible near the top
      if (currentOffset <= 20) {
        setIsVisible(true);
        prevOffset.current = currentOffset;
        ticking.current = false;
        return;
      }

      const diff = currentOffset - prevOffset.current;

      // Scroll Down (threshold 8px) -> Hide Navbar
      if (diff > 8 && currentOffset > 60) {
        setIsVisible(false);
      }
      // Scroll Up (threshold 8px) -> Show Navbar
      else if (diff < -8) {
        setIsVisible(true);
      }

      prevOffset.current = currentOffset;
      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        window.requestAnimationFrame(updateScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      ticking.current = false;
    };
  }, []);

  return isVisible;
}
