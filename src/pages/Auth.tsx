import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../store/useToastStore';
import { useThemeStore } from '../store/useThemeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Key, LogIn, UserPlus, ShieldAlert, ArrowRight, Laptop, ShieldCheck, Sun, Moon, Monitor, Globe, CheckCircle2, Check, Eye, EyeOff, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../components/ui/BottomSheet';
import { AuthSkeleton } from '../components/ui/AuthSkeleton';

const languages = [
  { code: 'vi', name: 'Tiếng Việt', label: 'VN' },
  { code: 'en', name: 'English', label: 'GB' },
  { code: 'es', name: 'Español', label: 'ES' },
  { code: 'pt', name: 'Português', label: 'PT' },
  { code: 'ru', name: 'Русский', label: 'RU' },
  { code: 'ar', name: 'العربية', label: 'SA' },
];

const Auth: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);
  
  const { theme, setTheme } = useThemeStore();
  const { setGuest } = useAuthStore();
  const addToast = useToastStore(state => state.addToast);
  const navigate = useNavigate();

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('dark');
  };

  const hasMinLength = password.length >= 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_~-]/.test(password);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({ message: t('auth.error_fill', 'Vui lòng nhập đầy đủ Email và Mật khẩu'), type: 'error' });
      return;
    }

    if (!isLogin) {
      if (!hasMinLength || !hasSpecialChar) {
        addToast({ message: t('auth.error_password_insecure', 'Mật khẩu chưa đáp ứng đủ tiêu chuẩn an toàn!'), type: 'error' });
        return;
      }
      if (password !== confirmPassword) {
        addToast({ message: t('auth.error_password_mismatch', 'Mật khẩu xác nhận không trùng khớp!'), type: 'error' });
        return;
      }
    }
    
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        addToast({ message: t('auth.success_login', 'Đăng nhập thành công!'), type: 'success' });
        navigate('/');
      } else {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;

        // Check if user session was created immediately or requires OTP/Confirmation
        if (data.session) {
          addToast({ message: t('auth.success_signup', 'Đăng ký thành công!'), type: 'success' });
          navigate('/');
        } else {
          // Requires OTP / Email Verification
          setIsOtpStep(true);
          addToast({ message: t('auth.otp_sent', 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!'), type: 'success' });
        }
      }
    } catch (error: any) {
      addToast({ message: error.message || t('auth.error_generic', 'Có lỗi xảy ra'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      addToast({ message: t('auth.error_otp_required', 'Vui lòng nhập mã OTP'), type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const { error, data } = await supabase.auth.verifyOtp({
        email,
        token: otpCode.trim(),
        type: 'signup',
      });

      if (error) {
        // Fallback try email type if signup type fails
        const { error: emailErr } = await supabase.auth.verifyOtp({
          email,
          token: otpCode.trim(),
          type: 'email',
        });
        if (emailErr) throw emailErr;
      }

      addToast({ message: t('auth.otp_verify_success', 'Xác thực OTP thành công! Đã đăng nhập.'), type: 'success' });
      navigate('/');
    } catch (error: any) {
      addToast({ message: error.message || t('auth.error_otp_invalid', 'Mã OTP không hợp lệ hoặc đã hết hạn'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
      addToast({ message: t('auth.otp_resent_success', 'Đã gửi lại mã OTP đến email của bạn!'), type: 'success' });
    } catch (error: any) {
      addToast({ message: error.message || t('auth.error_resend_otp', 'Không thể gửi lại mã OTP'), type: 'error' });
    } finally {
      setResendingOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addToast({ message: t('auth.error_email_required', 'Vui lòng nhập Email để khôi phục'), type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname + '#/reset-password'
      });
      if (error) throw error;
      addToast({ message: t('auth.reset_sent', 'Đã gửi liên kết khôi phục. Vui lòng kiểm tra email!'), type: 'success' });
      setIsForgotPassword(false);
    } catch (error: any) {
      addToast({ message: error.message || t('auth.error_generic', 'Có lỗi xảy ra'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname
        }
      });
      if (error) throw error;
    } catch (error: any) {
      addToast({ message: error.message || t('auth.error_google', 'Lỗi đăng nhập Google'), type: 'error' });
    }
  };

  const handleGuestLogin = () => {
    setGuest(true);
    addToast({ message: t('auth.guest_welcome', 'Đang sử dụng với tư cách Khách'), type: 'info' });
    navigate('/');
  };

  if (isInitialLoading) {
    return <AuthSkeleton />;
  }

  return (
    <div className="fixed inset-0 w-full h-full h-[100dvh] overflow-y-auto bg-background flex flex-col items-center p-3 sm:p-6 z-10">
      {/* Top Right Quick Controls: Theme & Language */}
      <div className="sticky top-3 right-3 self-end z-30 flex items-center gap-2 mb-2 sm:mb-0 sm:absolute sm:top-4 sm:right-4">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-surface border-2 border-border-main hover:border-primary text-text-main flex items-center justify-center transition-colors shadow-md cursor-pointer"
          title={theme === 'dark' ? t('settings.dark_theme', 'Giao diện Tối') : theme === 'light' ? t('settings.light_theme', 'Giao diện Sáng') : t('settings.system_theme', 'Giao diện Hệ thống')}
        >
          {theme === 'dark' ? <Moon size={16} className="text-sky-400 sm:w-[18px] sm:h-[18px]" /> : theme === 'light' ? <Sun size={16} className="text-amber-500 sm:w-[18px] sm:h-[18px]" /> : <Monitor size={16} className="text-text-muted sm:w-[18px] sm:h-[18px]" />}
        </button>

        {/* Language Picker Button */}
        <button
          type="button"
          onClick={() => setIsLanguageOpen(true)}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-surface border-2 border-border-main hover:border-primary text-text-main flex items-center justify-center transition-colors shadow-md cursor-pointer"
          title={t('more.language', 'Ngôn ngữ')}
        >
          <Globe size={16} className="text-primary sm:w-[18px] sm:h-[18px]" />
        </button>
      </div>

      <div className="w-full max-w-md animate-fade-in-up relative z-10 my-auto py-4 sm:py-6 shrink-0">
        {/* Logo/Brand Section */}
        <div className="text-center mb-3 sm:mb-5">
          <img src="./logo.png" alt="5TactiQ Logo" className="w-14 h-14 sm:w-20 sm:h-20 object-contain mx-auto mb-1.5 drop-shadow-md" />
          <h1 className="text-3xl sm:text-4xl font-display uppercase tracking-widest text-primary font-bold">5TactiQ</h1>
        </div>

        {/* Auth Box */}
        <div className="hallmark-card p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 bg-surface border-2 border-border-main shadow-xl relative overflow-hidden">
          {isForgotPassword ? (
            /* Forgot Password Form */
            <form onSubmit={handleResetPassword} className="space-y-4 animate-fade-in-up">
              <div className="text-center mb-2">
                <h3 className="font-display font-bold uppercase tracking-wider text-base text-primary">
                  {t('auth.reset_password_title', 'KHÔI PHỤC MẬT KHẨU')}
                </h3>
                <p className="text-xs text-text-muted mt-2 leading-relaxed">
                  {t('auth.reset_password_desc', 'Nhập email của bạn để nhận liên kết đặt lại mật khẩu.')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1 uppercase font-display tracking-widest">
                  {t('auth.email_label', 'Email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <Mail size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3.5 sm:pr-4 py-2.5 sm:py-3 bg-surface-2 border-2 border-border-main text-text-main focus:outline-none focus:border-primary transition-colors text-xs sm:text-sm font-medium placeholder:text-text-muted/50"
                    placeholder="coach@example.com"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="hallmark-btn w-full flex items-center justify-center py-3 sm:py-3.5 mt-2 bg-secondary text-white font-display text-sm sm:text-base uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition-all shadow-md gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t('auth.send_reset_btn', 'GỬI YÊU CẦU')
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="text-text-muted hover:text-primary font-display uppercase tracking-wider underline cursor-pointer text-xs font-bold"
                >
                  {t('auth.back_to_login', '← QUAY LẠI ĐĂNG NHẬP')}
                </button>
              </div>
            </form>
          ) : isOtpStep ? (
            /* OTP Step Form */
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in-up">
              <div className="text-center mb-2">
                <h3 className="font-display font-bold uppercase tracking-wider text-base text-primary">
                  {t('auth.otp_title', 'NHẬP MÃ OTP XÁC THỰC')}
                </h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  {t('auth.otp_desc', { email, defaultValue: `Mã xác thực OTP đã được gửi đến email {{email}}. Vui lòng kiểm tra hộp thư!` })}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1 uppercase font-display tracking-widest text-center">
                  {t('auth.otp_label', 'MÃ OTP (6 CHỮ SỐ)')}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center tracking-[0.4em] font-mono text-lg py-3 bg-surface-2 border-2 border-border-main text-text-main focus:outline-none focus:border-primary transition-colors font-bold uppercase"
                  placeholder="123456"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="hallmark-btn w-full flex items-center justify-center py-3 sm:py-3.5 bg-secondary text-white font-display text-sm sm:text-base uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition-all shadow-md gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t('auth.verify_otp_btn', 'XÁC THỰC OTP')
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsOtpStep(false)}
                  className="text-text-muted hover:text-primary font-display uppercase tracking-wider underline cursor-pointer"
                >
                  {t('auth.back_btn', '← Quay lại')}
                </button>
                <button
                  type="button"
                  disabled={resendingOtp}
                  onClick={handleResendOtp}
                  className="text-primary hover:text-secondary font-display font-bold uppercase tracking-wider underline disabled:opacity-50 cursor-pointer"
                >
                  {resendingOtp ? t('auth.resending_otp', 'Đang gửi...') : t('auth.resend_otp_btn', 'Gửi lại OTP')}
                </button>
              </div>
            </form>
          ) : (
            /* Login / Signup Form */
            <>
              <form onSubmit={handleEmailAuth} className="space-y-3 sm:space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1 uppercase font-display tracking-widest">
                      {t('auth.fullname_label', 'Họ và tên')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                        <UserIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 sm:pl-10 pr-3.5 sm:pr-4 py-2.5 sm:py-3 bg-surface-2 border-2 border-border-main text-text-main focus:outline-none focus:border-primary transition-colors text-xs sm:text-sm font-medium placeholder:text-text-muted/50"
                        placeholder={t('auth.fullname_placeholder', 'John Doe')}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1 uppercase font-display tracking-widest">
                    {t('auth.email_label', 'Email')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                      <Mail size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-3.5 sm:pr-4 py-2.5 sm:py-3 bg-surface-2 border-2 border-border-main text-text-main focus:outline-none focus:border-primary transition-colors text-xs sm:text-sm font-medium placeholder:text-text-muted/50"
                      placeholder="coach@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1 uppercase font-display tracking-widest">
                    {t('auth.password_label', 'Mật khẩu')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                      <Key size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-10 py-2.5 sm:py-3 bg-surface-2 border-2 border-border-main text-text-main focus:outline-none focus:border-primary transition-colors text-xs sm:text-sm font-medium placeholder:text-text-muted/50"
                      placeholder="••••••••"
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
                  {isLogin && (
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-[11px] font-display uppercase tracking-widest text-text-muted hover:text-primary font-bold underline transition-colors cursor-pointer"
                      >
                        {t('auth.forgot_password', 'Quên mật khẩu?')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Password Strength Checklist */}
                {!isLogin && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-2.5 bg-surface-2/60 border border-border-main/60 space-y-2 overflow-hidden my-1"
                    >
                      {/* Requirement 1: Min 8 chars */}
                      <div className="flex items-center gap-2 text-xs transition-colors duration-200">
                        <motion.div
                          animate={hasMinLength ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                            hasMinLength ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-surface border-border-main text-text-muted/30'
                          }`}
                        >
                          <Check size={10} strokeWidth={3} />
                        </motion.div>
                        <span className={`font-sans text-[11px] sm:text-xs transition-colors ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-text-muted/70'}`}>
                          {t('auth.req_min_length', 'Tối thiểu 8 ký tự')}
                        </span>
                      </div>

                      {/* Requirement 2: Special char */}
                      <div className="flex items-center gap-2 text-xs transition-colors duration-200">
                        <motion.div
                          animate={hasSpecialChar ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                            hasSpecialChar ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-surface border-border-main text-text-muted/30'
                          }`}
                        >
                          <Check size={10} strokeWidth={3} />
                        </motion.div>
                        <span className={`font-sans text-[11px] sm:text-xs transition-colors ${hasSpecialChar ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-text-muted/70'}`}>
                          {t('auth.req_special_char', 'Chứa ít nhất 1 ký tự đặc biệt (!@#$%...)')}
                        </span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* Confirm Password field (Only on Sign Up) */}
                {!isLogin && (
                  <div className="animate-fade-in-up">
                    <label className="block text-xs font-bold text-text-muted mb-1 uppercase font-display tracking-widest">
                      {t('auth.confirm_password_label', 'XÁC NHẬN MẬT KHẨU')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                        <Key size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-9 sm:pl-10 pr-10 py-2.5 sm:py-3 bg-surface-2 border-2 text-text-main focus:outline-none transition-colors text-xs sm:text-sm font-medium placeholder:text-text-muted/50 ${
                          confirmPassword && confirmPassword !== password 
                            ? 'border-red-500 focus:border-red-500' 
                            : confirmPassword && confirmPassword === password 
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
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">{t('auth.password_mismatch', 'Mật khẩu xác nhận không trùng khớp!')}</p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="hallmark-btn w-full flex items-center justify-center py-3 sm:py-3.5 mt-2 bg-secondary text-white font-display text-sm sm:text-base uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition-all shadow-md gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {isLogin ? (
                        <><LogIn size={16} className="sm:w-[18px] sm:h-[18px]" /> {t('auth.login_btn', 'ĐĂNG NHẬP')}</>
                      ) : (
                        <><UserPlus size={16} className="sm:w-[18px] sm:h-[18px]" /> {t('auth.signup_btn', 'ĐĂNG KÝ')}</>
                      )}
                    </>
                  )}
                </button>
              </form>

              <div className="mt-3 sm:mt-4 text-center text-[11px] sm:text-xs font-display uppercase tracking-widest">
                {isLogin ? (
                  <span className="text-text-muted">
                    {t('auth.no_account_prompt', 'Chưa có tài khoản?')}{' '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className="text-primary font-bold underline hover:text-secondary transition-colors cursor-pointer"
                    >
                      {t('auth.signup_now_btn', 'ĐĂNG KÝ NGAY')}
                    </button>
                  </span>
                ) : (
                  <span className="text-text-muted">
                    {t('auth.has_account_prompt', 'Đã có tài khoản?')}{' '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className="text-primary font-bold underline hover:text-secondary transition-colors cursor-pointer"
                    >
                      {t('auth.login_now_btn', 'ĐĂNG NHẬP')}
                    </button>
                  </span>
                )}
              </div>
              
              <div className="hallmark-divider relative my-3.5 sm:my-5">
                <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-surface px-2.5 sm:px-3 text-text-muted text-[10px] sm:text-xs font-display tracking-widest uppercase">
                  {t('auth.or_divider', 'HOẶC')}
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center py-2.5 sm:py-3.5 bg-surface-2 border-2 border-border-main text-text-main hover:border-primary hover:bg-surface transition-all font-display uppercase tracking-wider text-[11px] sm:text-xs font-bold gap-2.5 sm:gap-3 shadow-sm active:scale-[0.99] cursor-pointer"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>{t('auth.continue_google', 'TIẾP TỤC VỚI GOOGLE')}</span>
              </button>
            </>
          )}
        </div>

        {/* Guest Option */}
        <div className="text-center mb-4 sm:mb-6">
          <button
            onClick={handleGuestLogin}
            className="group inline-flex items-center justify-center w-full py-2.5 sm:py-3.5 px-4 sm:px-6 bg-surface/80 hover:bg-surface border-2 border-border-main hover:border-primary text-text-main transition-all font-display uppercase tracking-widest text-[11px] sm:text-xs font-bold gap-2 shadow-sm cursor-pointer"
          >
            <span>{t('auth.guest_btn', 'TRẢI NGHIỆM VỚI TƯ CÁCH KHÁCH')}</span>
            <ArrowRight size={15} className="text-secondary sm:w-[16px] sm:h-[16px] transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Terms Footer */}
        <div className="text-center pt-2 border-t border-border-main/40 w-full overflow-hidden">
          <p className="text-[9.5px] sm:text-[11px] text-text-muted/70 font-sans tracking-tight leading-relaxed">
            {t('auth.terms_agree', 'Bằng việc tiếp tục, bạn đồng ý với')}{' '}
            <button onClick={() => setShowTermsModal(true)} className="font-bold underline text-text-main hover:text-primary transition-colors cursor-pointer">
              {t('auth.terms_of_use', 'Điều khoản')}
            </button>
            {', '}
            <button onClick={() => setShowTermsModal(true)} className="font-bold underline text-text-main hover:text-primary transition-colors cursor-pointer">
              {t('auth.privacy_policy', 'Quyền riêng tư')}
            </button>{' '}
            {t('auth.and', '&')}{' '}
            <button onClick={() => setShowTermsModal(true)} className="font-bold underline text-text-main hover:text-primary transition-colors cursor-pointer">
              {t('auth.cookie_policy', 'Cookie')}
            </button>
            {'.'}
          </p>
        </div>
      </div>

      {/* Terms & Privacy Modal */}
      <BottomSheet
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title={
          <span className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-primary" /> {t('more.privacy_title')}
          </span>
        }
      >
        <div className="space-y-4 text-text-muted text-sm leading-relaxed p-1">
          <p>{t('more.privacy_msg_1', 'Ứng dụng 5TactiQ cam kết bảo vệ quyền riêng tư và an toàn dữ liệu của bạn.')}</p>
          <p>{t('more.privacy_msg_2', 'Dữ liệu khi đăng nhập (Email/Google) được mã hóa và đồng bộ an toàn trên đám mây Supabase Cloud. Ở chế độ Khách, dữ liệu được lưu trực tiếp trên thiết bị của bạn (Local Storage). Chúng tôi tuyệt đối không chia sẻ dữ liệu của bạn cho bất kỳ bên thứ ba nào.')}</p>
          <button 
            onClick={() => setShowTermsModal(false)}
            className="w-full bg-primary text-white font-display uppercase tracking-widest py-3 border-2 border-primary hover:bg-primary/90 transition-colors mt-4 text-sm font-bold cursor-pointer"
          >
            {t('common.close', 'ĐÓNG')}
          </button>
        </div>
      </BottomSheet>

      {/* Language Selector Modal */}
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
                  type: 'success', 
                  message: `${t('more.language_changed')} ${lang.name}`,
                  duration: 3000
                });
              }}
              className={`flex items-center justify-between p-4 border-2 transition-all cursor-pointer active:scale-95 ${i18n.language === lang.code ? 'border-primary bg-primary/5 text-primary shadow-[4px_4px_0px_0px_var(--color-primary)]' : 'border-border-main text-text-muted hover:border-primary/50'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-2 py-0.5 border border-border-main bg-surface-2">{lang.label}</span>
                <span className="font-display font-bold uppercase tracking-wider">{lang.name}</span>
              </div>
              {i18n.language === lang.code && <ShieldCheck size={20} className="text-primary" />}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};

export default Auth;
