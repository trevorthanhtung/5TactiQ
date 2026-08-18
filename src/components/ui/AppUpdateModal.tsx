import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, RefreshCw, X, ExternalLink, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppUpdateStore } from '../../store/useAppUpdateStore';
import { APP_VERSION } from '../../config/version';
import { Capacitor } from '@capacitor/core';

export default function AppUpdateModal() {
  const { t } = useTranslation();
  const { showUpdateModal, setShowUpdateModal, latestVersion } = useAppUpdateStore();
  const [platform, setPlatform] = useState<'android' | 'windows' | 'linux' | 'ios' | 'web'>('web');

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    const ua = navigator.userAgent || '';
    const isAndroid = isNative || /Android/i.test(ua);
    const isWindows = ua.toLowerCase().includes('electron') || /Win/i.test(ua);
    const isLinux = /Linux/i.test(ua) && !isAndroid;
    const isIos = /iPhone|iPad|iPod/i.test(ua);

    if (isAndroid) {
      setPlatform('android');
    } else if (isWindows) {
      setPlatform('windows');
    } else if (isLinux) {
      setPlatform('linux');
    } else if (isIos) {
      setPlatform('ios');
    } else {
      setPlatform('web');
    }
  }, []);

  if (!showUpdateModal) return null;

  const handleDownload = (url: string) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      window.location.href = url;
    }
  };

  const handleReloadWeb = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-surface border-2 border-border-main p-6 shadow-[10px_10px_0px_0px_var(--color-primary)] relative flex flex-col gap-4 text-text-main"
        >
          {/* Close button */}
          <button
            onClick={() => setShowUpdateModal(false)}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border-2 border-border-main hover:border-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
          >
            <X size={18} strokeWidth={2.5} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border-2 border-primary bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-primary">
                {platform === 'android' ? 'Android APK' : platform === 'windows' ? 'Windows App' : platform === 'linux' ? 'Linux App' : '5TactiQ Web'}
              </span>
              <h3 className="font-display font-extrabold text-xl uppercase tracking-tight text-text-main leading-tight">
                {t('update.title', 'CẬP NHẬT PHIÊN BẢN')}
              </h3>
            </div>
          </div>

          {/* Version comparison badge */}
          <div className="flex items-center justify-between p-3 border-2 border-dashed border-border-main bg-surface-2 font-mono text-xs">
            <div className="flex flex-col">
              <span className="text-text-muted text-[10px] uppercase font-bold">{t('update.current', 'Bản hiện tại')}</span>
              <span className="font-bold text-text-main text-sm">v{APP_VERSION}</span>
            </div>
            <div className="text-primary font-bold text-base font-sans">➔</div>
            <div className="flex flex-col items-end">
              <span className="text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold">{t('update.latest', 'Bản mới nhất')}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">v{latestVersion}</span>
            </div>
          </div>

          {/* Description based on platform */}
          <div className="text-xs text-text-muted leading-relaxed font-sans">
            {platform === 'android' && (
              <p>
                Đã có phiên bản <strong>v{latestVersion}</strong> mới nhất cho ứng dụng Android! Nhấn nút bên dưới để tải file APK và cài đặt nâng cấp ngay.
              </p>
            )}
            {platform === 'windows' && (
              <p>
                Đã có phiên bản <strong>v{latestVersion}</strong> mới nhất cho Windows. Tải bản Portable mới để sử dụng các tính năng mới nhất!
              </p>
            )}
            {platform === 'linux' && (
              <p>
                Đã có phiên bản <strong>v{latestVersion}</strong> mới nhất cho Linux (AppImage). Tải về và chạy trực tiếp!
              </p>
            )}
            {platform === 'web' && (
              <p>
                Đã có phiên bản <strong>v{latestVersion}</strong> mới nhất. Tải lại trang web để áp dụng ngay các cập nhật mới.
              </p>
            )}
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col gap-2 pt-2">
            {platform === 'android' && (
              <button
                onClick={() => {
                  handleDownload('https://github.com/trevorthanhtung/5TactiQ/releases/latest/download/5TactiQ.apk');
                  setShowUpdateModal(false);
                }}
                className="hallmark-btn w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <Download size={18} />
                <span>{t('update.btn_download_apk', 'TẢI FILE APK MỚI (v{{version}})', { version: latestVersion })}</span>
              </button>
            )}

            {platform === 'windows' && (
              <button
                onClick={() => {
                  handleDownload('https://github.com/trevorthanhtung/5TactiQ/releases/latest/download/5TactiQ-Portable.exe');
                  setShowUpdateModal(false);
                }}
                className="hallmark-btn w-full bg-primary hover:brightness-110 text-white py-3 px-4 font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <Download size={18} />
                <span>{t('update.btn_download_exe', 'TẢI BẢN WINDOWS (.EXE)')}</span>
              </button>
            )}

            {platform === 'linux' && (
              <button
                onClick={() => {
                  handleDownload('https://github.com/trevorthanhtung/5TactiQ/releases/latest/download/5TactiQ.AppImage');
                  setShowUpdateModal(false);
                }}
                className="hallmark-btn w-full bg-primary hover:brightness-110 text-white py-3 px-4 font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <Download size={18} />
                <span>{t('update.btn_download_linux', 'TẢI BẢN LINUX (APPIMAGE)')}</span>
              </button>
            )}

            {platform === 'web' && (
              <button
                onClick={handleReloadWeb}
                className="hallmark-btn w-full bg-primary hover:brightness-110 text-white py-3 px-4 font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <RefreshCw size={18} />
                <span>{t('update.btn_reload', 'TẢI LẠI TRANG ĐỂ CẬP NHẬT')}</span>
              </button>
            )}

            {/* Platform instructions tip */}
            {platform === 'android' && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-[11px] font-sans">
                <ShieldCheck size={16} className="shrink-0 text-amber-500 mt-0.5" />
                <span>
                  Sau khi tải xong, hãy nhấn vào file <strong>5TactiQ.apk</strong> trong bảng thông báo hoặc thư mục Download để cài đặt đè lên bản cũ (toàn bộ dữ liệu của bạn vẫn được giữ nguyên).
                </span>
              </div>
            )}
          </div>

          {/* Footer links */}
          <div className="flex items-center justify-between pt-2 border-t border-border-main text-[11px]">
            <a
              href="https://github.com/trevorthanhtung/5TactiQ/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-primary flex items-center gap-1 font-sans underline"
            >
              <span>{t('update.release_notes', 'Xem chi tiết thay đổi trên GitHub')}</span>
              <ExternalLink size={12} />
            </a>
            <button
              onClick={() => setShowUpdateModal(false)}
              className="text-text-muted hover:text-text-main font-sans uppercase font-bold cursor-pointer"
            >
              {t('update.later', 'Để sau')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
