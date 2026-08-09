import { useEffect, useRef } from 'react';

let isProgrammaticBack = false;

/**
 * Hook giúp quản lý nút Back trên Android (Hardware/Gesture Back).
 * Khi một Modal hoặc Bottom Sheet được mở, nó push 1 state giả vào history.
 * Khi bấm Back, nó chặn back trang web mà thay vào đó sẽ đóng Modal.
 */
export function useHardwareBack(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Push a dummy state to history stack
    window.history.pushState({ isOverlayOpen: true }, '');

    const handlePopState = (e: PopStateEvent) => {
      // Bỏ qua nếu sự kiện back là do code tự động gọi (dọn dẹp history)
      if (isProgrammaticBack) return;

      // Nếu user bấm nút Back vật lý, trình duyệt sẽ pop state này ra
      // Chúng ta gọi onClose() thay vì thoát app
      e.preventDefault();
      if (onCloseRef.current) onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      
      // Nếu Modal bị đóng bằng code (ví dụ: bấm nút X), 
      // ta cần dọn dẹp cái state giả vừa push vào history để tránh lỗi 2 lần back.
      if (window.history.state?.isOverlayOpen) {
        isProgrammaticBack = true;
        window.history.back();
        setTimeout(() => {
          isProgrammaticBack = false;
        }, 50);
      }
    };
  }, [isOpen]);
}
