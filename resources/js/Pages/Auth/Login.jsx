import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { BookOpen, Lock, Mail, ShieldCheck, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] text-black flex flex-col justify-center items-center p-4 font-sans antialiased selection:bg-blue-600 selection:text-white">
            <Head title="Iniciar Sesión | Corpo Documents" />

            <div className="w-full max-w-md">
                {/* Brand Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center bg-white p-3 rounded-2xl border-2 border-slate-300 shadow-sm mb-3">
                        <img
                            src="/images/CorpoAsia.jpg"
                            alt="Inversiones CorpoAsia C.A."
                            className="h-10 sm:h-12 w-auto object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-black uppercase">
                        Corpo<span className="text-blue-700">Documents</span>
                    </h1>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-wider mt-1">
                        Sistema Institucional de Facturación & Archivo
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-xl p-5 sm:p-8">
                    <div className="mb-6 pb-4 border-b-2 border-slate-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-black text-black">
                                Iniciar Sesión
                            </h2>
                            <p className="text-xs font-bold text-slate-800">
                                Ingrese sus credenciales para acceder al sistema
                            </p>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                            <Lock className="w-5 h-5" />
                        </div>
                    </div>

                    {status && (
                        <div className="mb-5 p-3 rounded-lg bg-emerald-100 border border-emerald-400 text-xs font-black text-emerald-950 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
                            <span>{status}</span>
                        </div>
                    )}

                    {Object.keys(errors).length > 0 && (
                        <div className="mb-5 p-3 rounded-lg bg-red-100 border border-red-400 text-xs font-black text-red-950 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-800 shrink-0 mt-0.5" />
                            <div>
                                {errors.email && <p>{errors.email}</p>}
                                {errors.password && <p>{errors.password}</p>}
                            </div>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="text-xs font-black text-black block mb-1">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-700 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    value={data.email}
                                    placeholder="admin@corpoasia.com"
                                    autoComplete="username"
                                    autoFocus
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full bg-white border-2 border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 text-xs font-black text-black rounded-lg pl-9 pr-3 py-2.5 transition-colors placeholder:text-slate-500"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-xs font-black text-black block mb-1">
                                Contraseña
                            </label>
                            <div className="relative">
                                <KeyRound className="w-4 h-4 text-slate-700 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    value={data.password}
                                    placeholder="••••••••••••"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full bg-white border-2 border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 text-xs font-black text-black rounded-lg pl-9 pr-3 py-2.5 transition-colors placeholder:text-slate-500"
                                />
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 rounded border-2 border-slate-400 text-blue-700 focus:ring-blue-600"
                                />
                                <span className="text-xs font-black text-black">
                                    Recordar sesión en este equipo
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-black hover:bg-slate-900 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                        >
                            <span>INGRESAR AL SISTEMA</span>
                            <ArrowRight className="w-4 h-4 text-sky-400" />
                        </button>
                    </form>

                    {/* Credenciales de demostración */}
                    <div className="mt-6 pt-4 border-t-2 border-slate-200 bg-amber-50 p-3 rounded-lg border border-amber-300">
                        <span className="text-[11px] font-black uppercase text-amber-950 block mb-0.5">
                            Acceso de Administrador:
                        </span>
                        <p className="text-xs font-bold text-black font-mono">
                            Email: <strong>admin@corpoasia.com</strong>
                        </p>
                        <p className="text-xs font-bold text-black font-mono">
                            Contraseña: <strong>password123</strong>
                        </p>
                    </div>
                </div>

                {/* Footer Security Notice */}
                <div className="text-center mt-6 text-xs font-bold text-slate-800">
                    <p className="flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span>Acceso restringido a personal autorizado</span>
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">
                        Registro público deshabilitado por políticas de seguridad interna.
                    </p>
                </div>
            </div>
        </div>
    );
}
