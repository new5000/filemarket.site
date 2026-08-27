import { useEffect, useState, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  freezeOnceVisible?: boolean;
}

/**
 * High-performance IntersectionObserver hook for lazy-loading media,
 * unmounting off-screen iframe/video elements, and reducing memory on low-end devices.
 */
export function useIntersectionObserver(
  elementRef: RefObject<Element | null>,
  {
    threshold = 0,
    root = null,
    rootMargin = '200px',
    freezeOnceVisible = false,
  }: UseIntersectionObserverOptions = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);

  useEffect(() => {
    const node = elementRef?.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsIntersecting(true);
      return;
    }

    let isFrozen = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);

        if (isElementIntersecting && freezeOnceVisible && !isFrozen) {
          isFrozen = true;
          observer.unobserve(node);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, threshold, root, rootMargin, freezeOnceVisible]);

  return isIntersecting;
}
