import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { useThemeStore } from '../store/useThemeStore';
import { useNavigate } from 'react-router-dom';
import { Key, Eye, EyeOff, Check, Sun, Moon, Globe, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomSheet } from '../components/ui/BottomSheet';

export default function ResetPassword() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const { theme, setTheme } = useThemeStore();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('dark');
  };

  const hasMinLength = newPassword.length >= 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_~-]/.test(newPassword);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasMinLength || !hasSpecialChar) {
      addToast({ message: t('auth.error_password_insecure', 'Mật khẩu chưa đáp ứng đủ tiêu chuẩn an toàn!'), type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({ message: t('auth.error_password_mismatch', 'Mật khẩu xác nhận không trùng khớp!'), type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        addToast({ message: error.message, type: 'error' });
      } else {
        addToast({ message: t('auth.reset_success', 'Cập nhật mật khẩu thành công! Vui lòng đăng nhập lại.'), type: 'success' });
        await signOut();
        navigate('/');
      }
    } catch (err: any) {
      addToast({ message: err.message || 'Lỗi không xác định', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const isLinkExpired = window.location.hash.includes('error_code=otp_expired') || 
                        window.location.hash.includes('error_description') || 
                        window.location.search.includes('error_code=otp_expired');

  return (
    <div className="fixed inset-0 w-full h-full h-[100dvh] overflow-y-auto bg-background flex flex-col items-center p-3 sm:p-6 z-10">
      {/* Top Right Quick Controls */}
      <div className="sticky top-3 right-3 self-end z-30 flex items-center gap-2 mb-2 sm:mb-0 sm:absolute sm:top-4 sm:right-4">
        <button
          type="button"
          onClick={() => setIsLanguageOpen(true)}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-surface border-2 border-border-main hover:border-primary text-text-main flex items-center justify-center transition-colors shadow-md cursor-pointer"
          title={t('more.language', 'Ngôn ngữ')}
        >
          <Globe size={16} />
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-surface border-2 border-border-main hover:border-primary text-text-main flex items-center justify-center transition-colors shadow-md cursor-pointer"
          title={theme === 'dark' ? t('settings.dark_theme') : t('settings.light_theme')}
        >
          {theme === 'dark' ? <Moon size={16} className="text-sky-400" /> : <Sun size={16} className="text-amber-500" />}
        </button>
      </div>

      <div className="w-full max-w-md animate-fade-in-up relative z-10 my-auto py-4 sm:py-6 shrink-0">
        {/* Logo Section */}
        <div className="text-center mb-4 sm:mb-6">
          <img src="./logo.png" alt="5TactiQ Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto mb-2 drop-shadow-md" />
          <h1 className="text-3xl sm:text-4xl font-display uppercase tracking-widest text-primary font-bold">5TactiQ</h1>
        </div>

        {/* Form Card */}
        <div className="hallmark-card p-4 sm:p-6 md:p-8 mb-4 bg-surface border-2 border-border-main shadow-xl relative overflow-hidden">
          {isLinkExpired ? (
            <div className="text-center py-4">
              <h3 className="font-display font-bold uppercase tracking-wider text-lg text-rose-600 mb-2">
                {t('auth.link_expired_title', 'LIÊN KẾT ĐÃ HẾT HẠN')}
              </h3>
              <p className="text-xs text-text-muted leading-relaxed mb-6">
                {t('auth.link_expired_desc', 'Đường dẫn khôi phục mật khẩu này đã hết hạn hoặc đã được sử dụng. Vui lòng quay lại màn hình Đăng nhập để gửi lại yêu cầu mới.')}
              </p>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  window.location.href = window.location.origin + window.location.pathname;
                }}
                className="hallmark-btn w-full flex items-center justify-center py-3.5 bg-primary text-white font-display text-sm uppercase tracking-widest hover:brightness-110 cursor-pointer"
              >
                {t('auth.back_to_login', '← QUAY LẠI ĐĂNG NHẬP')}
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-4">
                <h3 className="font-display font-bold uppercase tracking-wider text-lg text-primary">
                  {t('auth.reset_page_title', 'TẠO MẬT KHẨU MỚI')}
                </h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  {t('auth.reset_page_desc', 'Nhập mật khẩu mới cho tài khoản của bạn để hoàn tất khôi phục.')}
                </p>
              </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1 uppercase font-display tracking-widest">
                {t('auth.new_password_label', 'MẬT KHẨU MỚI')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Key size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-surface-2 border-2 border-border-main text-text-main focus:outline-none focus:border-primary transition-colors text-xs sm:text-sm font-medium"
                  placeholder="••••••••"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-primary transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Strength checklist */}
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-2.5 bg-surface-2/60 border border-border-main/60 space-y-2 overflow-hidden my-1"
              >
                <div className="flex items-center gap-2 text-xs transition-colors duration-200">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                      hasMinLength ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-surface border-border-main text-text-muted/30'
                    }`}
                  >
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <span className={`font-sans text-xs ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-text-muted/70'}`}>
                    {t('auth.req_min_length', 'Tối thiểu 8 ký tự')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs transition-colors duration-200">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                      hasSpecialChar ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-surface border-border-main text-text-muted/30'
                    }`}
                  >
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <span className={`font-sans text-xs ${hasSpecialChar ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-text-muted/70'}`}>
                    {t('auth.req_special_char', 'Chứa ít nhất 1 ký tự đặc biệt (!@#$%...)')}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            <div>
              <label className="block text-xs font-bold text-text-muted mb-1 uppercase font-display tracking-widest">
                {t('auth.confirm_new_password_label', 'XÁC NHẬN MẬT KHẨU MỚI')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Key size={16} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 bg-surface-2 border-2 text-text-main focus:outline-none transition-colors text-xs sm:text-sm font-medium ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-500 focus:border-red-500'
                      : confirmPassword && confirmPassword === newPassword
                      ? 'border-emerald-500 focus:border-emerald-500'
                      : 'border-border-main focus:border-primary'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-primary transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{t('auth.password_mismatch', 'Mật khẩu xác nhận không trùng khớp!')}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="hallmark-btn w-full flex items-center justify-center py-3.5 mt-4 bg-secondary text-white font-display text-sm sm:text-base uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition-all shadow-md gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                t('auth.save_new_password_btn', 'CẬP NHẬT MẬT KHẨU')
              )}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-border-main/40 mt-4">
            <button
              type="button"
              onClick={() => {
                signOut();
                navigate('/');
              }}
              className="text-text-muted hover:text-primary font-display uppercase tracking-wider underline cursor-pointer text-xs font-bold inline-flex items-center gap-1.5"
            >
              {t('auth.back_to_login', '← QUAY LẠI ĐĂNG NHẬP')}
            </button>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Language Modal */}
      <BottomSheet
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <Globe size={24} className="text-primary" /> {t('more.language', 'Ngôn ngữ')}
          </span>
        }
      >
        <div className="flex flex-col gap-3 p-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                i18n.changeLanguage(lang.code);
                setIsLanguageOpen(false);
                addToast({ 
                  message: lang.code === 'vi' ? 'Đã chuyển sang Tiếng Việt' : `Switched to ${lang.name}`, 
                  type: 'info' 
                });
              }}
              className={`flex items-center justify-between p-3.5 border-2 transition-all cursor-pointer ${
                i18n.language === lang.code
                  ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                  : 'border-border-main hover:border-primary/50 text-text-main hover:bg-surface-2'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none">{lang.flag}</span>
                <span className="font-display uppercase tracking-wider text-sm">{lang.name}</span>
              </div>
              {i18n.language === lang.code && <Check size={20} className="text-primary" />}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
