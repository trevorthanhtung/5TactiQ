import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { useTranslation } from 'react-i18next';

interface QRScannerProps {
  onScan: (text: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function QRScanner({ onScan, isOpen, onClose }: QRScannerProps) {
  const { t } = useTranslation();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen && window.isSecureContext) {
      // Delay initialization slightly to ensure DOM element is ready in BottomSheet
      const timer = setTimeout(() => {
        if (!document.getElementById('reader')) return;
        
        scannerRef.current = new Html5QrcodeScanner(
          'reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            rememberLastUsedCamera: true
          },
          false
        );

        scannerRef.current.render(
          (decodedText) => {
            if (scannerRef.current) {
              scannerRef.current.clear();
              scannerRef.current = null;
            }
            onScan(decodedText);
            onClose();
          },
          (error) => {
            // Ignore scan errors, they happen continuously when no QR is in view
          }
        );
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
          scannerRef.current = null;
        }
      };
    }
  }, [isOpen, onScan, onClose]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('sync.qr_title', 'QUÉT MÃ QR')}>
      <div className="flex flex-col items-center">
        {!window.isSecureContext ? (
          <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 p-4 text-center w-full max-w-sm mb-4">
            <Camera className="mx-auto mb-2 opacity-50" size={32} />
            <p className="font-bold mb-2">{t('sync.qr_no_camera', 'Không thể truy cập Camera!')}</p>
            <p className="text-sm">{t('sync.qr_https_req', 'Tính năng quét QR yêu cầu môi trường bảo mật (HTTPS) để hoạt động. Vì bạn đang truy cập qua địa chỉ IP mạng nội bộ nên trình duyệt đã chặn Camera.')}</p>
            <p className="text-sm font-bold mt-3 text-rose-800">{t('sync.qr_solution', 'Giải pháp: Hãy dùng tính năng "Nhập mã tay 6 số" ở màn hình trước.')}</p>
          </div>
        ) : (
          <>
            <p className="text-text-muted mb-4 text-sm text-center">{t('sync.qr_instruction', 'Hướng camera vào mã QR trên máy Phát để tự động nhận mã kết nối.')}</p>
            <div id="reader" className="w-full max-w-sm overflow-hidden border-4 border-border-main"></div>
          </>
        )}
        <button
          onClick={onClose}
          className="mt-6 w-full font-display uppercase tracking-wider py-3 border-2 border-slate-300 text-text-muted hover:bg-slate-50 transition-colors"
        >
          {t('sync.qr_cancel', 'Hủy quét')}
        </button>
      </div>
    </BottomSheet>
  );
}
