import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Download, RefreshCw, Send, QrCode, CheckCircle2, Camera } from 'lucide-react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { exportData, downloadJsonFile, parseBackupData, importSelectedData, STORAGE_KEYS_META } from '../lib/sync';
import { usePeerSync } from '../hooks/usePeerSync';
import { useToastStore } from '../store/useToastStore';
import { QRCodeCanvas } from 'qrcode.react';
import { useSearchParams } from 'react-router-dom';
import { SyncSkeleton } from '../components/ui/SyncSkeleton';
import { BottomSheet } from '../components/ui/BottomSheet';
import { QRScanner } from '../components/ui/QRScanner';

export default function DataSync() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const sharedTitle = searchParams.get('title');
  const sharedText = searchParams.get('text');
  const sharedUrl = searchParams.get('url');

  const handleDataReceived = (content: string) => {
    const parsed = parseBackupData(content);
    if (parsed) {
      setPendingImportData(parsed);
      setSelectedImportKeys(Object.keys(parsed).filter(k => STORAGE_KEYS_META[k]));
    } else {
      setAlertInfo({ title: t('sync.err_title', 'LỖI'), message: t('sync.err_invalid_p2p', 'Dữ liệu P2P không hợp lệ.') });
    }
  };

  const { peerId, status: peerStatus, errorMsg, initHost, connectToHost, reset: resetPeer, setStatus: setPeerStatus } = usePeerSync(handleDataReceived);
  const [pendingImportData, setPendingImportData] = useState<Record<string, any> | null>(null);
  const [selectedImportKeys, setSelectedImportKeys] = useState<string[]>([]);
  const [connectCode, setConnectCode] = useState('');
  const [syncMode, setSyncMode] = useState<'none' | 'host' | 'client'>('none');
  const [alertInfo, setAlertInfo] = useState<{ title: string, message: string, onClose?: () => void } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleExportFile = async () => {
    const jsonStr = await exportData();

    if (Capacitor.isNativePlatform()) {
      try {
        const fileName = `5tactiq_backup_${new Date().getTime()}.5tactiq`;
        const result = await Filesystem.writeFile({
          path: fileName,
          data: jsonStr,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });

        await Share.share({
          title: t('sync.share_title', '5TactiQ Backup'),
          text: t('sync.share_text', 'Dữ liệu sao lưu từ 5TactiQ'),
          url: result.uri,
          dialogTitle: t('sync.share_dialog', 'Lưu hoặc chia sẻ file sao lưu')
        });
      } catch (err) {
        console.error('Lỗi xuất file native:', err);
        setAlertInfo({ title: t('sync.err_title', 'LỖI'), message: 'Không thể tạo file sao lưu. Vui lòng thử lại.' });
      }
      return;
    }

    // Web logic: Check if Native Share with Files is supported
    if (navigator.share && navigator.canShare) {
      try {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const file = new File([blob], '5tactiq_backup.5tactiq', { type: 'application/json' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: t('sync.share_title', '5TactiQ Backup'),
            text: t('sync.share_text', 'Dữ liệu sao lưu từ 5TactiQ'),
            files: [file]
          });
          return;
        }
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    }

    // Fallback to traditional download
    downloadJsonFile(jsonStr);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseBackupData(content);
        if (parsed) {
          setPendingImportData(parsed);
          setSelectedImportKeys(Object.keys(parsed).filter(k => STORAGE_KEYS_META[k]));
        } else {
          setAlertInfo({
            title: t('sync.err_data_title', 'LỖI DỮ LIỆU'),
            message: t('sync.err_invalid_file', 'File dữ liệu không hợp lệ hoặc bị hỏng.')
          });
        }
      }
      if (e.target) e.target.value = ''; // Reset input to allow re-importing the same file
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!pendingImportData) return;
    const success = await importSelectedData(pendingImportData, selectedImportKeys);
    if (success) {
      window.location.replace('/');
    } else {
      setAlertInfo({ title: t('sync.err_title', 'LỖI'), message: t('sync.err_restore_fail', 'Không thể phục hồi dữ liệu.') });
      setPendingImportData(null);
    }
  };

  if (isLoading) {
    return <SyncSkeleton />;
  }

  return (
    <div className="@container p-4 flex flex-col min-h-full max-w-5xl mx-auto w-full pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 @sm:gap-3 mb-6 pt-2">
        <button
          onClick={() => navigate('/more')}
          className="p-2 text-primary hover:bg-primary/10 border-2 border-primary/30 hover:border-primary transition-all shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl @md:text-4xl font-display uppercase text-primary leading-none">{t('sync.title', 'Đồng bộ & Sao lưu')}</h1>
        </div>
      </div>

      <div className="hallmark-divider mb-6"></div>

      {/* Shared Target Data (Nếu được mở từ ứng dụng khác) */}
      {(sharedTitle || sharedText || sharedUrl) && (
        <div className="bg-emerald-50 border-2 border-emerald-500/20 p-6 mb-6">
          <h3 className="font-bold uppercase text-emerald-700 mb-2">{t('sync.shared_title', '📥 Dữ liệu được chia sẻ tới:')}</h3>
          {sharedTitle && <p className="text-sm font-bold text-slate-700">{sharedTitle}</p>}
          {sharedText && <p className="text-sm text-text-muted mt-1">{sharedText}</p>}
          {sharedUrl && (
            <a href={sharedUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline mt-2 block break-all">
              {sharedUrl}
            </a>
          )}
          <p className="text-xs text-slate-400 mt-3 italic">{t('sync.shared_desc', 'Tính năng này hữu ích khi bạn nhận được link sơ đồ chiến thuật từ bạn bè qua Zalo/Mess.')}</p>
        </div>
      )}

      {/* File Backup */}
      <div className="bg-surface border-2 border-border-main p-6 mb-6">
        <h3 className="font-bold uppercase text-text-main font-display text-base tracking-wide mb-2">{t('sync.file_title', '1. Sao lưu bằng File (.5tactiQ)')}</h3>
        <p className="text-sm text-text-muted mb-4">{t('sync.file_desc', 'Lưu toàn bộ dữ liệu hiện tại về máy, hoặc phục hồi từ file đã lưu.')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handleExportFile}
            className="w-full hallmark-btn flex items-center justify-center gap-2 bg-primary text-white py-3"
          >
            <Download size={18} /> {t('sync.export_btn', 'XUẤT FILE')}
          </button>

          <label className="w-full hallmark-btn-outline flex items-center justify-center gap-2 cursor-pointer py-3">
            <Upload size={18} /> {t('sync.import_btn', 'NHẬP FILE')}
            <input type="file" accept="*/*" className="hidden" onChange={handleImportFile} />
          </label>
        </div>
      </div>

      {/* WebRTC Sync */}
      <div className="bg-surface border-2 border-secondary/30 p-6">
        <h3 className="font-bold uppercase text-text-main font-display text-base tracking-wide mb-2">{t('sync.p2p_title', '2. Kết nối trực tiếp (P2P)')}</h3>
        <p className="text-sm text-text-muted mb-4">{t('sync.p2p_desc', 'Đồng bộ siêu tốc 2 thiết bị. Không lưu vết qua Server trung gian, bảo mật tuyệt đối.')}</p>

        {syncMode === 'none' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => { setSyncMode('host'); initHost(); }}
              className="w-full hallmark-btn flex items-center justify-center gap-3 bg-emerald-600 text-white py-3 @sm:py-4"
            >
              <Send size={20} className="@sm:w-6 @sm:h-6" />
              <span>{t('sync.host_btn', 'PHÁT TÍN HIỆU')}</span>
            </button>
            <button
              type="button"
              onClick={() => setSyncMode('client')}
              className="w-full hallmark-btn flex items-center justify-center gap-3 bg-amber-500 text-white py-3 @sm:py-4"
            >
              <QrCode size={20} className="@sm:w-6 @sm:h-6" />
              <span>{t('sync.client_btn', 'QUÉT MÃ BẮT SÓNG')}</span>
            </button>
          </div>
        )}

        {syncMode === 'host' && (
          <div className="flex flex-col items-center text-center">
            <p className="font-display font-bold uppercase tracking-widest text-text-main mb-3">{t('sync.host_instruction', 'Nhập mã này trên máy nhận')}</p>

            {peerStatus === 'initializing' && (
              <div className="w-full max-w-xs h-[72px] bg-surface animate-pulse border-2 border-border-main mb-4 flex items-center justify-center text-slate-400 font-display uppercase tracking-widest">
                {t('sync.host_generating', 'Đang tạo mã...')}
              </div>
            )}

            {peerId && (
              <>
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText(peerId);
                    useToastStore.getState().addToast({
                      message: t('sync.copied_connect_code'),
                      type: 'success'
                    });
                  }}
                  className="cursor-pointer hover:bg-surface-2 active:scale-95 transition-all text-5xl font-display text-text-main tracking-widest bg-surface border-2 border-border-main px-8 py-4 w-full max-w-xs mb-6 shadow-inner relative group"
                  title={t('sync.host_click_to_copy', 'Nhấn để sao chép')}
                >
                  {peerId}
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/90 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-sans font-bold uppercase tracking-widest">{t('sync.host_copy_hint', 'Bấm để copy')}</span>
                  </div>
                </div>
                
                <div className="w-full max-w-xs border-2 border-dashed border-primary/30 p-6 bg-surface flex flex-col items-center justify-center mb-6">
                  <QRCodeCanvas value={peerId} size={200} includeMargin={true} />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mt-4 text-center">{t('sync.host_scan_camera', 'Quét bằng Camera')}</p>
                </div>
                
                <div className="h-6 flex items-center justify-center">
                  {peerStatus === 'ready' && <span className="text-sm font-bold text-text-muted animate-pulse">{t('sync.host_status_waiting', 'Đang chờ kết nối...')}</span>}
                  {peerStatus === 'connected' && <span className="text-sm font-bold text-secondary animate-pulse">{t('sync.host_status_sending', 'Đang truyền dữ liệu...')}</span>}
                  {peerStatus === 'success' && <span className="text-sm font-bold text-emerald-600">{t('sync.host_status_success', 'Truyền dữ liệu thành công!')}</span>}
                  {peerStatus === 'error' && <span className="text-sm font-bold text-rose-600">{t('sync.host_status_error', 'Lỗi:')} {errorMsg}</span>}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => { setSyncMode('none'); resetPeer(); }}
              className="w-full max-w-xs font-display uppercase tracking-wider py-3 border-2 border-border-main text-text-muted hover:bg-surface-2 transition-colors mt-6"
            >
              {t('sync.host_cancel', 'Hủy phát')}
            </button>
          </div>
        )}

        {syncMode === 'client' && (
          <div className="flex flex-col items-center">
            <p className="font-display font-bold uppercase tracking-widest text-secondary mb-4 text-center">{t('sync.client_instruction', 'Nhập mã 6 ký tự từ máy Phát')}</p>

            <div className="flex flex-col gap-4 w-full max-w-xs mb-6">
              <input
                type="text"
                maxLength={6}
                value={connectCode}
                onChange={e => setConnectCode(e.target.value.toUpperCase())}
                className="w-full text-center text-5xl font-display tracking-[0.2em] border-4 border-border-main focus:border-secondary focus:bg-secondary/5 outline-none p-4 uppercase transition-colors shadow-inner text-text-main placeholder:text-text-muted/30"
                placeholder={t('sync.client_placeholder', '------')}
              />

              <div className="flex items-center gap-3 mt-2 w-full lg:hidden">
                <div className="h-[2px] flex-1 bg-surface"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{t('sync.client_or', 'Hoặc')}</span>
                <div className="h-[2px] flex-1 bg-surface"></div>
              </div>
              
              <button
                onClick={() => setIsQRScannerOpen(true)}
                className="w-full border-2 border-dashed border-secondary/40 p-4 bg-surface flex flex-col items-center justify-center hover:bg-secondary/5 hover:border-secondary transition-all group active:scale-95 lg:hidden"
              >
                <Camera size={32} className="text-secondary/60 group-hover:text-secondary mb-2 transition-colors" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-secondary transition-colors text-center">{t('sync.client_scan_camera', 'Quét mã QR bằng Camera')}</p>
              </button>
            </div>

            <div className="h-6 flex items-center justify-center mb-6">
              {peerStatus === 'connecting' && <span className="text-sm font-bold text-text-muted animate-pulse">{t('sync.client_status_connecting', 'Đang kết nối...')}</span>}
              {peerStatus === 'connected' && <span className="text-sm font-bold text-secondary animate-pulse">{t('sync.client_status_receiving', 'Đã kết nối! Đang nhận dữ liệu...')}</span>}
              {peerStatus === 'success' && <span className="text-sm font-bold text-emerald-600">{t('sync.client_status_success', 'Nhận thành công! Đang tải lại...')}</span>}
              {peerStatus === 'error' && <span className="text-sm font-bold text-rose-600">{t('sync.host_status_error', 'Lỗi:')} {errorMsg}</span>}
            </div>

            <div className="flex gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => { setSyncMode('none'); resetPeer(); }}
                className="flex-1 font-display uppercase tracking-wider py-3 border-2 border-border-main text-text-muted hover:bg-surface-2 transition-colors"
              >
                {t('sync.client_cancel', 'Hủy')}
              </button>
              <button
                type="button"
                onClick={() => connectToHost(connectCode)}
                disabled={connectCode.length < 6 || peerStatus === 'connecting'}
                className="flex-[2] hallmark-btn bg-secondary text-white py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('sync.client_connect', 'KẾT NỐI')}
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Alert Modal */}
      <BottomSheet
        isOpen={!!alertInfo}
        onClose={() => {
          if (alertInfo?.onClose) alertInfo.onClose();
          setAlertInfo(null);
        }}
        title={alertInfo?.title}
      >
        <div className="flex flex-col">
          <p className="text-text-muted text-sm md:text-base font-sans mb-8 whitespace-pre-line leading-relaxed">{alertInfo?.message}</p>
          <button
            onClick={() => {
              if (alertInfo?.onClose) alertInfo.onClose();
              setAlertInfo(null);
            }}
            className="w-full bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-[#323d29] transition-colors active:scale-95"
          >
            {t('sync.understood', 'Đã hiểu')}
          </button>
        </div>
      </BottomSheet>
      {/* Import Selection Modal */}
      <BottomSheet
        isOpen={!!pendingImportData}
        onClose={() => setPendingImportData(null)}
        title={t('sync.import_title', 'CHỌN DỮ LIỆU PHỤC HỒI')}
      >
        <div className="flex flex-col">
          <p className="text-text-muted text-sm mb-4">{t('sync.import_desc', 'Vui lòng chọn các mục bạn muốn nhập vào máy này. Dữ liệu cũ của các mục được chọn sẽ bị ghi đè.')}</p>
          
          <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-1">
            {pendingImportData && Object.keys(pendingImportData).filter(k => STORAGE_KEYS_META[k]).map(key => (
              <div 
                key={key} 
                onClick={() => {
                  if (selectedImportKeys.includes(key)) {
                    setSelectedImportKeys(prev => prev.filter(k => k !== key));
                  } else {
                    setSelectedImportKeys(prev => [...prev, key]);
                  }
                }}
                className={`flex items-center justify-between p-4 border-2 cursor-pointer transition-all ${selectedImportKeys.includes(key) ? 'border-primary bg-primary/5' : 'border-border-main bg-surface hover:border-primary/30'}`}
              >
                <span className={`font-bold uppercase tracking-wider text-sm ${selectedImportKeys.includes(key) ? 'text-primary' : 'text-text-muted'}`}>
                  {t(`sync.storage_keys.${key}`, STORAGE_KEYS_META[key])}
                </span>
                {selectedImportKeys.includes(key) ? (
                  <CheckCircle2 className="text-primary" size={22} />
                ) : (
                  <div className="w-[22px] h-[22px] rounded-full border-2 border-slate-300"></div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPendingImportData(null)}
              className="flex-1 font-display uppercase tracking-wider py-3 border-2 border-border-main text-text-muted hover:bg-surface-2 transition-colors"
            >
              {t('sync.import_cancel', 'Hủy')}
            </button>
            <button
              onClick={confirmImport}
              disabled={selectedImportKeys.length === 0}
              className="flex-[2] bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-[#323d29] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('sync.import_confirm', 'Xác nhận')}
            </button>
          </div>
        </div>
      </BottomSheet>
      
      <QRScanner 
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={(text) => {
          // peerId is exactly 6 chars in our app, but maybe we can just set it
          const cleanedText = text.replace(/[^A-Za-z0-9]/g, '').substring(0, 6).toUpperCase();
          if (cleanedText.length === 6) {
            setConnectCode(cleanedText);
            connectToHost(cleanedText);
          } else {
            setConnectCode(text.substring(0, 6).toUpperCase());
          }
        }}
      />
    </div>
  );
}
