import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../store/useToastStore';
import { useThemeStore } from '../store/useThemeStore';
import { Mail, Key, LogIn, UserPlus, ShieldAlert, ArrowRight, Laptop, ShieldCheck, Sun, Moon, Monitor, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../components/ui/BottomSheet';

const languages = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

const Auth: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  
  const { theme, setTheme } = useThemeStore();
  const { setGuest } = useAuthStore();
  const addToast = useToastStore(state => state.addToast);
  const navigate = useNavigate();

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('dark');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({ message: t('auth.error_fill', 'Vui lòng nhập đầy đủ Email và Mật khẩu'), type: 'error' });
      return;
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        addToast({ message: t('auth.success_signup', 'Đăng ký thành công! Vui lòng kiểm tra email.'), type: 'success' });
        if (!supabase.auth.getSession()) {
          // If confirmation required
        } else {
          navigate('/');
        }
      }
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 relative">
      {/* Top Right Quick Controls: Theme & Language */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-10 h-10 bg-surface border-2 border-border-main hover:border-primary text-text-main flex items-center justify-center transition-colors shadow-sm cursor-pointer"
          title={theme === 'dark' ? 'Giao diện Tối' : theme === 'light' ? 'Giao diện Sáng' : 'Giao diện Hệ thống'}
        >
          {theme === 'dark' ? <Moon size={18} className="text-sky-400" /> : theme === 'light' ? <Sun size={18} className="text-amber-500" /> : <Monitor size={18} className="text-text-muted" />}
        </button>

        {/* Language Picker Button */}
        <button
          type="button"
          onClick={() => setIsLanguageOpen(true)}
          className="w-10 h-10 bg-surface border-2 border-border-main hover:border-primary text-text-main flex items-center justify-center transition-colors shadow-sm cursor-pointer"
          title="Đổi ngôn ngữ"
        >
          <Globe size={18} className="text-primary" />
        </button>
      </div>

      <div className="w-full max-w-md animate-fade-in-up relative z-10 my-auto">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-surface border-2 border-primary shadow-lg mb-4 p-3 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
            <img src="./logo.png" alt="5TactiQ Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <h1 className="text-4xl font-display uppercase tracking-widest text-primary mb-1.5 font-bold">5TactiQ</h1>
          <p className="text-text-muted text-sm font-sans tracking-wide">
            {isLogin 
              ? t('auth.subtitle_login', 'Đăng nhập để đồng bộ chiến thuật & dữ liệu của bạn')
              : t('auth.subtitle_signup', 'Tạo tài khoản 5TactiQ mới hoàn toàn miễn phí')
            }
          </p>
        </div>

        {/* Auth Box */}
        <div className="hallmark-card p-6 sm:p-8 mb-6 bg-surface border-2 border-border-main shadow-xl relative overflow-hidden">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5 uppercase font-display tracking-widest">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-2 border-2 border-border-main text-text-main focus:outline-none focus:border-primary transition-colors text-sm font-medium placeholder:text-text-muted/50"
                  placeholder="coach@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5 uppercase font-display tracking-widest">
                {t('auth.password_label', 'Mật khẩu')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                  <Key size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-2 border-2 border-border-main text-text-main focus:outline-none focus:border-primary transition-colors text-sm font-medium placeholder:text-text-muted/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="hallmark-btn w-full flex items-center justify-center py-3.5 mt-2 bg-secondary text-white font-display text-base uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition-all shadow-md gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? (
                    <><LogIn size={18} /> {t('auth.login_btn', 'ĐĂNG NHẬP')}</>
                  ) : (
                    <><UserPlus size={18} /> {t('auth.signup_btn', 'ĐĂNG KÝ')}</>
                  )}
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary text-xs uppercase font-display tracking-widest font-bold hover:underline transition-colors cursor-pointer"
            >
              {isLogin ? t('auth.switch_to_signup', 'Chưa có tài khoản? Đăng ký ngay') : t('auth.switch_to_login', 'Đã có tài khoản? Đăng nhập')}
            </button>
          </div>
          
          <div className="hallmark-divider relative my-6">
            <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-surface px-3 text-text-muted text-xs font-display tracking-widest uppercase">
              {t('auth.or_divider', 'HOẶC')}
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center py-3.5 bg-surface-2 border-2 border-border-main text-text-main hover:border-primary hover:bg-surface transition-all font-display uppercase tracking-wider text-xs font-bold gap-3 shadow-sm active:scale-[0.99]"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>{t('auth.continue_google', 'TIẾP TỤC VỚI GOOGLE')}</span>
          </button>
        </div>

        {/* Guest Option */}
        <div className="text-center mb-8">
          <button
            onClick={handleGuestLogin}
            className="group inline-flex items-center justify-center w-full py-3.5 px-6 bg-surface/80 hover:bg-surface border-2 border-border-main hover:border-primary text-text-main transition-all font-display uppercase tracking-widest text-xs font-bold gap-2 shadow-sm cursor-pointer"
          >
            <span>{t('auth.guest_btn', 'TRẢI NGHIỆM VỚI TƯ CÁCH KHÁCH')}</span>
            <ArrowRight size={16} className="text-secondary transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Terms Footer */}
        <div className="text-center pt-2 border-t border-border-main/40">
          <p className="text-[10px] sm:text-[11px] text-text-muted/70 font-sans tracking-tight whitespace-nowrap">
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
                <span className="text-2xl">{lang.flag}</span>
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
