import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { BottomSheet } from './ui/BottomSheet';
import { Key, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export const ResetPasswordModal: React.FC = () => {
  const { t } = useTranslation();
  const { isPasswordRecovery, setIsPasswordRecovery } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

      if (error) throw error;

      addToast({
        message: t('auth.password_updated_success', 'Đã cập nhật mật khẩu mới thành công!'),
        type: 'success',
      });
      setIsPasswordRecovery(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      addToast({
        message: error.message || t('auth.error_generic', 'Có lỗi xảy ra khi đổi mật khẩu'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isPasswordRecovery) return null;

  return (
    <BottomSheet
      isOpen={isPasswordRecovery}
      onClose={() => setIsPasswordRecovery(false)}
      title={
        <span className="flex items-center gap-2 text-primary font-display font-bold uppercase">
          <ShieldCheck size={24} /> {t('auth.reset_modal_title', 'ĐẶT LẠI MẬT KHẨU MỚI')}
        </span>
      }
    >
      <form onSubmit={handleUpdatePassword} className="space-y-4 p-1">
        <p className="text-xs text-text-muted leading-relaxed">
          {t('auth.reset_modal_desc', 'Vui lòng nhập mật khẩu mới cho tài khoản của bạn.')}
        </p>

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
              className="w-full pl-10 pr-10 py-3 bg-surface-2 border-2 border-border-main text-text-main focus:outline-none focus:border-primary transition-colors text-sm font-medium"
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

        {/* Password Strength Checklist */}
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
              className={`w-full pl-10 pr-10 py-3 bg-surface-2 border-2 text-text-main focus:outline-none transition-colors text-sm font-medium ${
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
          className="hallmark-btn w-full flex items-center justify-center py-3.5 mt-4 bg-secondary text-white font-display text-base uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition-all shadow-md gap-2 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            t('auth.save_new_password_btn', 'CẬP NHẬT MẬT KHẨU')
          )}
        </button>
      </form>
    </BottomSheet>
  );
};
