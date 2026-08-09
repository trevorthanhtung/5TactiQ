import React, { useState } from 'react';
import { useInAppBrowser } from '../../hooks/useInAppBrowser';
import { AlertCircle, X, ExternalLink } from 'lucide-react';

export default function InAppBrowserWarning() {
  const isInApp = useInAppBrowser();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isInApp || isDismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-100 border-b-2 border-amber-300 p-3 shadow-md flex items-start gap-3 animate-fade-in-up">
      <div className="text-amber-600 shrink-0 mt-0.5">
        <AlertCircle size={20} />
      </div>
      <div className="flex-1">
        <h4 className="font-display font-bold text-amber-900 text-sm uppercase mb-1">
          Trình duyệt bị giới hạn
        </h4>
        <p className="text-xs text-amber-800 font-sans leading-relaxed mb-2">
          Bạn đang mở 5TactiQ trong ứng dụng bên thứ ba (Facebook, Zalo, v.v.). Một số tính năng như Lưu Trữ Offline, Thông báo, và Cài đặt App có thể không hoạt động.
        </p>
        <p className="text-xs font-bold text-amber-900 flex items-center gap-1">
          <ExternalLink size={14} /> Hãy mở bằng Safari hoặc Chrome.
        </p>
      </div>
      <button 
        onClick={() => setIsDismissed(true)}
        className="shrink-0 p-1 bg-amber-200/50 hover:bg-amber-300/50 text-amber-700 rounded-full transition-colors active:scale-95"
      >
        <X size={16} />
      </button>
    </div>
  );
}
