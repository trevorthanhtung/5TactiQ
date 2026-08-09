import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { useTranslation } from 'react-i18next';

interface QRScannerProps {
  onScan: (text: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function QRScanner({ onScan, isOpen, onClose }: QRScannerProps) {
  const { t } = useTranslation();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (isOpen && window.isSecureContext) {
      const timer = setTimeout(() => {
        if (!document.getElementById('reader')) return;

        const html5QrCode = new Html5Qrcode('reader');
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 220, height: 220 }
        };

        const handleSuccess = (decodedText: string) => {
          if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
              scannerRef.current?.clear();
              scannerRef.current = null;
            }).catch(() => {});
          }
          onScan(decodedText);
          onClose();
        };

        const startCamera = async () => {
          try {
            // Thử tự động khởi chạy Cam Sau (facingMode environment) ngay lập tức
            await html5QrCode.start(
              { facingMode: 'environment' },
              config,
              handleSuccess,
              () => {}
            );
          } catch {
            // Nếu không dùng được facingMode, tìm camera sau trong danh sách thiết bị
            try {
              const devices = await Html5Qrcode.getCameras();
              if (devices && devices.length > 0) {
                // Ưu tiên camera có chữ 'back' hoặc 'rear', hoặc chọn cam cuối cùng
                const backCam = devices.find(d => 
                  d.label.toLowerCase().includes('back') || 
                  d.label.toLowerCase().includes('rear') ||
                  d.label.toLowerCase().includes('sau')
                ) || devices[devices.length - 1];

                await html5QrCode.start(
                  backCam.id,
                  config,
                  handleSuccess,
                  () => {}
                );
              }
            } catch (err) {
              console.error("Không thể mở Camera:", err);
            }
          }
        };

        startCamera();
      }, 250);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          }).catch(() => {});
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
            <p className="text-sm">{t('sync.qr_https_req', 'Tính năng quét QR yêu cầu môi trường bảo mật (HTTPS) để hoạt động.')}</p>
            <p className="text-sm font-bold mt-3 text-rose-800">{t('sync.qr_solution', 'Giải pháp: Hãy dùng tính năng "Nhập mã tay 6 số" ở màn hình trước.')}</p>
          </div>
        ) : (
          <>
            <p className="text-text-muted mb-4 text-sm text-center">{t('sync.qr_instruction', 'Hướng camera vào mã QR trên máy Phát để tự động nhận mã kết nối.')}</p>
            
            {/* CSS ẩn hoàn toàn các nút Select Camera / Start Scanning dư thừa của thư viện */}
            <div className="w-full max-w-sm overflow-hidden border-4 border-border-main rounded-lg relative min-h-[260px] bg-black">
              <div id="reader" className="w-full h-full [&_button]:hidden [&_select]:hidden [&_img]:hidden"></div>
            </div>
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
