import Icon from './Icon';

/** Conserve le hash Jitsi du backend et y fusionne éventuellement le displayName. */
function buildSrc(roomUrl, displayName) {
  if (!roomUrl) return '';
  if (!displayName) return roomUrl;

  const hashIdx = roomUrl.indexOf('#');
  const base = hashIdx >= 0 ? roomUrl.slice(0, hashIdx) : roomUrl;
  let hash = hashIdx >= 0 ? roomUrl.slice(hashIdx + 1) : '';

  const encoded = encodeURIComponent(displayName);
  if (/userInfo\.displayName=/.test(hash)) {
    hash = hash.replace(/userInfo\.displayName=[^&]*/, `userInfo.displayName=${encoded}`);
  } else {
    hash = hash ? `${hash}&userInfo.displayName=${encoded}` : `userInfo.displayName=${encoded}`;
  }

  if (!/config\.prejoinPageEnabled=/.test(hash)) {
    hash = `config.prejoinPageEnabled=false&${hash}`;
  }

  return `${base}#${hash}`;
}

export default function JitsiMeet({ roomUrl, roomName, displayName }) {
  if (!roomUrl) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-2xl border border-dashed bg-slate-50">
        <p className="text-sm text-slate-500">Salle de consultation indisponible</p>
      </div>
    );
  }

  const src = buildSrc(roomUrl, displayName);

  return (
    <div className="overflow-hidden rounded-2xl border bg-slate-900 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-800 px-4 py-2 text-xs text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="video" className="h-3.5 w-3.5" /> Téléconsultation — {roomName}
        </span>
        <a href={src} target="_blank" rel="noreferrer" className="rounded-lg bg-cyan-500/20 px-3 py-1 font-semibold text-cyan-300 hover:bg-cyan-500/30">
          Ouvrir dans un nouvel onglet
        </a>
      </div>
      <p className="bg-slate-850 px-4 py-1.5 text-[11px] text-slate-400">
        Si la vidéo ne s&apos;affiche pas ici (blocage iframe), utilisez « Ouvrir dans un nouvel onglet ».
      </p>
      <iframe
        title={roomName || 'Téléconsultation'}
        src={src}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="h-[70vh] w-full border-0"
      />
    </div>
  );
}
