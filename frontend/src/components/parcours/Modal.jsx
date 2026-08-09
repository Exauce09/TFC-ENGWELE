import Icon from '../Icon';

export default function Modal({ open, title, onClose, children, wide = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white text-slate-900 shadow-2xl ${
          wide ? 'max-w-2xl' : 'max-w-lg'
        }`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1 p-5 text-slate-900 [&_input]:text-slate-900 [&_select]:text-slate-900 [&_textarea]:text-slate-900 [&_label]:text-slate-800">
          {children}
        </div>
      </div>
    </div>
  );
}
