export interface ToastData {
  id: number;
  title: string;
  message: string;
  type: 'alert' | 'success' | 'info';
}

interface Props {
  toasts: ToastData[];
}

const styleMap: Record<ToastData['type'], { bg: string; border: string; text: string }> = {
  alert: { bg: 'bg-[#FF4D6D]/10', border: 'border-[#FF4D6D]/50', text: 'text-[#FF4D6D]' },
  success: { bg: 'bg-[#00FFA3]/10', border: 'border-[#00FFA3]/50', text: 'text-[#00FFA3]' },
  info: { bg: 'bg-[#00E5FF]/10', border: 'border-[#00E5FF]/50', text: 'text-[#00E5FF]' },
};

export default function Toasts({ toasts }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm">
      {toasts.map((t) => {
        const s = styleMap[t.type];
        return (
          <div
            key={t.id}
            className={`rounded-xl border ${s.border} ${s.bg} backdrop-blur-xl px-4 py-3 shadow-2xl`}
            style={{ animation: 'slideIn 300ms ease-out' }}
          >
            <div className={`text-xs font-bold uppercase tracking-widest ${s.text} mb-1`}>
              {t.title}
            </div>
            <div className="text-sm text-white/80">{t.message}</div>
          </div>
        );
      })}
    </div>
  );
}