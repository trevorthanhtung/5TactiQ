import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Zap, ZapOff } from 'lucide-react';
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
  const [flashEnabled, setFlashEnabled] = useState(false);

  const toggleFlash = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      } catch (err) {
        console.error("Flash not supported", err);
      }
    }
  };

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
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              // Tìm camera sau
              let backCams = devices.filter(d => 
                d.label.toLowerCase().includes('back') || 
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('sau') ||
                d.label.toLowerCase().includes('environment')
              );
              
              if (backCams.length === 0) {
                  // Fallback
                  backCams = devices;
              }

              // Loại bỏ các camera góc rộng, tele, macro, depth
              let mainBackCam = backCams.find(d => 
                  !d.label.toLowerCase().includes('ultra') &&
                  !d.label.toLowerCase().includes('wide') &&
                  !d.label.toLowerCase().includes('góc rộng') &&
                  !d.label.toLowerCase().includes('tele') &&
                  !d.label.toLowerCase().includes('depth') &&
                  !d.label.toLowerCase().includes('macro')
              );

              const selectedCameraId = mainBackCam ? mainBackCam.id : backCams[0].id;

              await html5QrCode.start(
                selectedCameraId,
                config,
                handleSuccess,
                () => {}
              );
            } else {
               // Fallback to facingMode if no devices found
               await html5QrCode.start({ facingMode: 'environment' }, config, handleSuccess, () => {});
            }
          } catch (err) {
            console.error("Không thể mở Camera:", err);
            // Cố gắng fallback lần cuối
            try {
              await html5QrCode.start({ facingMode: 'environment' }, config, handleSuccess, () => {});
            } catch (fallbackErr) {
              console.error("Fallback cũng thất bại:", fallbackErr);
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
        setFlashEnabled(false);
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
            <div className="w-full max-w-sm overflow-hidden border-4 border-border-main rounded-lg relative min-h-[260px] bg-black group">
              <div id="reader" className="w-full h-full [&_button]:hidden [&_select]:hidden [&_img]:hidden"></div>
              
              {/* Flash Toggle Button */}
              <button 
                onClick={toggleFlash}
                className={`absolute bottom-4 right-4 p-3 rounded-full transition-all shadow-lg border border-white/20 z-10 ${
                  flashEnabled ? 'bg-primary text-white scale-110' : 'bg-black/50 text-white/80 hover:bg-black/70'
                }`}
                title="Bật/Tắt Flash"
              >
                {flashEnabled ? <Zap size={24} /> : <ZapOff size={24} />}
              </button>
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
