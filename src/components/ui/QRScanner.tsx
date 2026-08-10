import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, RefreshCcw } from 'lucide-react';
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
  const [cameras, setCameras] = useState<{ id: string, label: string }[]>([]);
  const [currentCamIndex, setCurrentCamIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let localScanner: Html5Qrcode | null = null;

    if (isOpen && window.isSecureContext) {
      const timer = setTimeout(() => {
        if (!isMounted || !document.getElementById('reader')) return;

        const html5QrCode = new Html5Qrcode('reader');
        scannerRef.current = html5QrCode;
        localScanner = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 220, height: 220 }
        };

        const handleSuccess = (decodedText: string) => {
          if (localScanner) {
            try {
              localScanner.stop().then(() => {
                localScanner?.clear();
              }).catch(() => {});
            } catch (e) {}
          }
          onScan(decodedText);
          onClose();
        };

        const startCamera = async () => {
          try {
            if (!isMounted) return;
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              const backCams = devices.filter(d => 
                d.label.toLowerCase().includes('back') || 
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('sau') ||
                d.label.toLowerCase().includes('environment') ||
                d.label.toLowerCase().includes('camera2')
              );
              
              const availableCams = backCams.length > 0 ? backCams : devices;
              setCameras(availableCams);
              
              // Cố gắng chọn camera không phải góc siêu rộng
              let mainBackCam = availableCams.find(d => 
                  !d.label.toLowerCase().includes('ultra') &&
                  !d.label.toLowerCase().includes('wide') &&
                  !d.label.toLowerCase().includes('góc rộng') &&
                  !d.label.toLowerCase().includes('tele') &&
                  !d.label.toLowerCase().includes('depth') &&
                  !d.label.toLowerCase().includes('macro')
              );

              const selectedId = mainBackCam ? mainBackCam.id : availableCams[0].id;
              const idx = availableCams.findIndex(c => c.id === selectedId);
              setCurrentCamIndex(idx >= 0 ? idx : 0);
              
              await html5QrCode.start(selectedId, config, handleSuccess, () => {});
            } else {
              await html5QrCode.start({ facingMode: 'environment' }, config, handleSuccess, () => {});
            }
          } catch (err) {
            console.error("Không thể mở Camera:", err);
            try {
              if (isMounted) await html5QrCode.start({ facingMode: 'environment' }, config, handleSuccess, () => {});
            } catch (e) {}
          }
        };

        startCamera();
      }, 250);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (localScanner) {
          try {
            localScanner.stop().then(() => {
              localScanner?.clear();
            }).catch(() => {});
          } catch (e) {}
        }
        setCameras([]);
      };
    }
  }, [isOpen, onScan, onClose]);

  const switchCamera = async () => {
    if (cameras.length < 2 || !scannerRef.current) return;
    const nextIndex = (currentCamIndex + 1) % cameras.length;
    setCurrentCamIndex(nextIndex);
    
    try {
      await scannerRef.current.stop();
      
      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 }
      };
      
      await scannerRef.current.start(cameras[nextIndex].id, config, 
        (decodedText) => {
           if (scannerRef.current) {
              try { scannerRef.current.stop().then(()=> scannerRef.current?.clear()).catch(()=>{}) } catch(e){}
           }
           onScan(decodedText);
           onClose();
        }, () => {}
      );
    } catch (e) {
       console.error('Lỗi khi đổi camera', e);
    }
  };

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
            
            {/* CSS ẩn hoàn toàn các nút Select Camera / Start Scanning dư thừa của thư viện và bỏ object-cover để ko lệch QR */}
            <div className="w-full max-w-sm overflow-hidden border-4 border-border-main rounded-lg relative min-h-[260px] bg-black group">
              <div id="reader" className="w-full h-full [&_button]:hidden [&_select]:hidden [&_img]:hidden"></div>
              
              {/* Camera Switcher */}
              {cameras.length > 1 && (
                <button 
                  onClick={switchCamera}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/70 transition-all shadow-lg border border-white/20 z-10"
                  title="Đổi Camera"
                >
                  <RefreshCcw size={20} />
                </button>
              )}
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
