import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollNavButton: React.FC = () => {
  const [direction, setDirection] = useState<'top' | 'bottom'>('bottom');
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const pressTimeoutRef = useRef<number | null>(null);

  // Kích hoạt phản hồi viền sáng tức thì khi chạm trên mobile (chạm nhanh cũng sáng rõ)
  const triggerTouchFeedback = () => {
    setIsPressed(true);
    if (pressTimeoutRef.current !== null) {
      window.clearTimeout(pressTimeoutRef.current);
    }
    pressTimeoutRef.current = window.setTimeout(() => {
      setIsPressed(false);
      pressTimeoutRef.current = null;
    }, 380);
  };

  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current !== null) {
        window.clearTimeout(pressTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const checkScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const innerHeight = window.innerHeight;
      const maxScroll = scrollHeight - innerHeight;

      // Trang không có độ dài cuộn đáng kể thì ẩn nút
      if (maxScroll <= 120) {
        setIsVisible(false);
        return;
      }

      setIsVisible(true);

      const distanceToTop = scrollY;
      const distanceToBottom = Math.max(0, maxScroll - scrollY);

      // Khi khoảng cách tới đầu trang xa hơn cuối trang: nút có chức năng lên đầu trang
      // Ngược lại: nút có chức năng xuống cuối trang
      if (distanceToTop > distanceToBottom) {
        setDirection('top');
      } else {
        setDirection('bottom');
      }
    };

    checkScroll();
    window.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Gỡ bỏ focus lập tức trên mobile để không bị dính viền outline/focus sau khi chạm
    e.currentTarget.blur();
    triggerTouchFeedback();

    if (direction === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const label = direction === 'top' ? 'Lên đầu trang' : 'Xuống cuối trang';

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={triggerTouchFeedback}
      title={label}
      aria-label={label}
      className={`scroll-nav-btn fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 w-12 h-12 rounded-full glass-wine border border-rose-500/40 text-rose-200 shadow-2xl shadow-black/80 flex items-center justify-center cursor-pointer select-none ${
        isPressed ? 'is-pressed' : ''
      } ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-6 pointer-events-none'
      }`}
    >
      <ArrowUp
        className={`w-5 h-5 transition-transform duration-500 ease-out ${
          direction === 'bottom' ? 'rotate-180' : 'rotate-0'
        }`}
      />
    </button>
  );
};

export default ScrollNavButton;
