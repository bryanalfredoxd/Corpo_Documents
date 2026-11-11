import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Info,
    X,
    Trash2,
    Ban,
    ArrowRightLeft
} from 'lucide-react';

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [confirmState, setConfirmState] = useState(null);
    const resolveRef = useRef(null);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((type, message, title = null) => {
        if (!message) return;
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev.slice(-4), { id, type, message, title }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4500);
    }, []);

    const notify = {
        success: (msg, title = 'Operación Exitosa') => addToast('success', msg, title),
        error: (msg, title = 'Atención') => addToast('error', msg, title),
        warning: (msg, title = 'Aviso') => addToast('warning', msg, title),
        info: (msg, title = 'Información') => addToast('info', msg, title),
    };

    const confirm = useCallback((options) => {
        const normalized = typeof options === 'string'
            ? { message: options }
            : (options || {});

        return new Promise((resolve) => {
            resolveRef.current = resolve;
            setConfirmState({
                title: normalized.title || 'Confirmar Acción',
                message: normalized.message || '¿Deseas continuar con esta operación?',
                confirmLabel: normalized.confirmLabel || 'Confirmar',
                cancelLabel: normalized.cancelLabel || 'Cancelar',
                variant: normalized.variant || 'primary', // 'danger' | 'warning' | 'primary'
            });
        });
    }, []);

    const handleResolveConfirm = (result) => {
        setConfirmState(null);
        if (resolveRef.current) {
            resolveRef.current(result);
            resolveRef.current = null;
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && confirmState) {
                handleResolveConfirm(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [confirmState]);

    const toastStyles = {
        success: {
            wrapper: 'bg-emerald-950 text-white border-emerald-400',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
            titleColor: 'text-emerald-300',
        },
        error: {
            wrapper: 'bg-red-950 text-white border-red-400',
            icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
            titleColor: 'text-red-300',
        },
        warning: {
            wrapper: 'bg-amber-950 text-white border-amber-400',
            icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
            titleColor: 'text-amber-300',
        },
        info: {
            wrapper: 'bg-slate-900 text-white border-blue-400',
            icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
            titleColor: 'text-sky-300',
        },
    };

    const variantMeta = {
        danger: {
            iconBg: 'bg-red-100 text-red-700 border-red-300',
            icon: <Trash2 className="w-5 h-5" />,
            btn: 'bg-red-700 hover:bg-red-800 text-white',
        },
        warning: {
            iconBg: 'bg-amber-100 text-amber-800 border-amber-300',
            icon: <Ban className="w-5 h-5" />,
            btn: 'bg-amber-600 hover:bg-amber-700 text-white',
        },
        primary: {
            iconBg: 'bg-blue-100 text-blue-700 border-blue-300',
            icon: <ArrowRightLeft className="w-5 h-5" />,
            btn: 'bg-blue-700 hover:bg-blue-800 text-white',
        },
    };

    const currentConfirmMeta = variantMeta[confirmState?.variant || 'primary'] || variantMeta.primary;

    return (
        <FeedbackContext.Provider value={{ notify, confirm }}>
            {children}

            {/* Stack de Notificaciones React Toast */}
            <div className="fixed top-4 right-4 z-[80] flex flex-col gap-2.5 max-w-sm w-[calc(100%-2rem)] pointer-events-none no-print">
                {toasts.map(toast => {
                    const style = toastStyles[toast.type] || toastStyles.info;
                    return (
                        <div
                            key={toast.id}
                            className={`pointer-events-auto rounded-xl border-2 shadow-2xl p-3.5 flex items-start gap-3 transition-all ${style.wrapper}`}
                        >
                            {style.icon}
                            <div className="flex-1 min-w-0 text-xs">
                                {toast.title && (
                                    <span className={`font-black uppercase tracking-wide block text-[10px] mb-0.5 ${style.titleColor}`}>
                                        {toast.title}
                                    </span>
                                )}
                                <p className="font-bold leading-snug break-words">
                                    {toast.message}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => dismissToast(toast.id)}
                                className="text-white/70 hover:text-white p-0.5 rounded cursor-pointer shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Modal React de Confirmación Elegante */}
            {confirmState && (
                <div className="fixed inset-0 z-[75] bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 no-print">
                    <div className="bg-white border-2 border-black rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
                        <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl border shrink-0 ${currentConfirmMeta.iconBg}`}>
                                {currentConfirmMeta.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-black text-black uppercase tracking-tight">
                                    {confirmState.title}
                                </h3>
                                <p className="text-xs font-medium text-slate-700 mt-1.5 whitespace-pre-line leading-relaxed">
                                    {confirmState.message}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => handleResolveConfirm(false)}
                                className="h-9 px-4 bg-white border-2 border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-black text-black cursor-pointer"
                            >
                                {confirmState.cancelLabel}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleResolveConfirm(true)}
                                className={`h-9 px-4 rounded-lg text-xs font-black cursor-pointer shadow-xs ${currentConfirmMeta.btn}`}
                            >
                                {confirmState.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </FeedbackContext.Provider>
    );
}

export function useFeedback() {
    const ctx = useContext(FeedbackContext);
    if (!ctx) {
        return {
            notify: {
                success: () => {},
                error: () => {},
                warning: () => {},
                info: () => {},
            },
            confirm: async () => true,
        };
    }
    return ctx;
}

