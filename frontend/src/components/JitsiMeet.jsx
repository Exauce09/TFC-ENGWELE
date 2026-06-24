export default function JitsiMeet({ roomUrl, roomName, displayName }) {
  if (!roomUrl) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-2xl border border-dashed bg-slate-50">
        <p className="text-sm text-slate-500">Salle de consultation indisponible</p>
      </div>
    );
  }

  const src = displayName
    ? `${roomUrl.split('#')[0]}#config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(displayName)}`
    : roomUrl;

  return (
    <div className="overflow-hidden rounded-2xl border bg-slate-900 shadow-lg">
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2 text-xs text-slate-300">
        <span>🎥 Téléconsultation — {roomName}</span>
        <a href={src} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
          Ouvrir dans un nouvel onglet
        </a>
      </div>
      <iframe
        title="Téléconsultation Jitsi"
        src={src}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="h-[70vh] w-full border-0"
      />
    </div>
  );
}
