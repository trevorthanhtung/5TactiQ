import { useToastStore, type Toast } from '../../store/useToastStore';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const toastIcons = {
  success: <CheckCircle2 size={24} className="text-primary" strokeWidth={2.5} />,
  error: <AlertCircle size={24} className="text-[#e35d2a]" strokeWidth={2.5} />,
  info: <Info size={24} className="text-primary" strokeWidth={2.5} />,
  warning: <AlertTriangle size={24} className="text-[#e35d2a]" strokeWidth={2.5} />
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast: Toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            layout
            className="bg-surface border-2 border-primary shadow-[4px_4px_0px_0px_var(--color-primary)] p-4 w-full pointer-events-auto flex items-start gap-4"
          >
            <div className="shrink-0 mt-0.5">{toastIcons[toast.type]}</div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm md:text-base font-sans text-primary font-medium leading-relaxed">{toast.message}</p>
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.onClick();
                    removeToast(toast.id);
                  }}
                  className="mt-3 bg-primary text-white font-display text-xs md:text-sm font-bold uppercase tracking-widest px-4 py-2 border-2 border-primary hover:bg-secondary transition-colors active:scale-95"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 text-primary/60 hover:text-primary transition-colors hover:bg-primary/5 active:scale-95"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
