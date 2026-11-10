import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function FlashBanner({ message }) {
    if (!message) return null;

    return (
        <div className="bg-emerald-100 border-b-2 border-emerald-500 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-black text-emerald-950 no-print">
            <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>{message}</span>
            </div>
        </div>
    );
}

