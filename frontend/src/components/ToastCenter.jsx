import { useEffect, useMemo, useState } from 'react';

function toastStyles(type) {
  if (type === 'error') return 'border-red-100 bg-red-50 text-red-800';
  if (type === 'success') return 'border-emerald-100 bg-emerald-50 text-emerald-800';
  if (type === 'info') return 'border-sky-100 bg-sky-50 text-sky-800';
  return 'border-slate-200 bg-white text-slate-800';
}

export default function ToastCenter() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {};
      const message = detail.message || 'Action effectuée';
      const type = detail.type || 'success';
      const ttlMs = Number(detail.ttlMs || 3500);

      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [{ id, message, type }, ...prev].slice(0, 5));

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, ttlMs);
    };

    window.addEventListener('amen:toast', handler);
    return () => window.removeEventListener('amen:toast', handler);
  }, []);

  const rendered = useMemo(
    () =>
      toasts.map((t) => (
        <div
          key={t.id}
          className={`w-[min(420px,92vw)] rounded-xl border px-4 py-3 text-sm shadow-sm ${toastStyles(t.type)}`}
        >
          <p className="font-medium">{t.type === 'error' ? 'Erreur' : 'Notification'}</p>
          <p className="mt-0.5">{t.message}</p>
        </div>
      )),
    [toasts],
  );

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-5 top-16 z-[100] flex flex-col gap-2">
      {rendered}
    </div>
  );
}

