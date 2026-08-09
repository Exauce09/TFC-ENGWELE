<?php

namespace App\Services;

class JitsiService
{
    /**
     * Nom de salle dédié et non prédictible (lié au RDV + secret app).
     */
    public function roomName(int $rendezVousId): string
    {
        $prefix = config('integrations.jitsi.room_prefix', 'amen-rdv');
        $secret = (string) config('integrations.jitsi.room_secret', config('app.key'));
        $token = substr(hash_hmac('sha256', 'rdv:'.$rendezVousId, $secret), 0, 12);

        return sprintf('%s-%d-%s', $prefix, $rendezVousId, $token);
    }

    public function domain(): string
    {
        return (string) config('integrations.jitsi.domain', 'meet.jit.si');
    }

    /**
     * URL iframe de la salle dédiée (config Jitsi standardisée).
     */
    public function embedUrl(int $rendezVousId, ?string $displayName = null, bool $moderator = false): string
    {
        $room = $this->roomName($rendezVousId);
        $base = 'https://'.$this->domain().'/'.$room;

        $hash = [
            'config.prejoinPageEnabled=false',
            'config.startWithAudioMuted=true',
            'config.startWithVideoMuted=false',
            'config.disableDeepLinking=true',
            'config.enableClosePage=false',
        ];

        if ($moderator) {
            $hash[] = 'config.startSilent=false';
        }

        if ($displayName) {
            $hash[] = 'userInfo.displayName='.rawurlencode($displayName);
        }

        return $base.'#'.implode('&', $hash);
    }

    /** @deprecated use embedUrl */
    public function roomUrl(int $rendezVousId, ?string $displayName = null): string
    {
        return $this->embedUrl($rendezVousId, $displayName);
    }

    /**
     * Assure qu'une salle dédiée est persistée sur le RDV.
     *
     * @return array{room_name: string, lien_video: string}
     */
    public function ensureDedicatedRoom(\App\Models\RendezVous $rdv): array
    {
        $roomName = $this->roomName((int) $rdv->id);
        $lien = $this->embedUrl((int) $rdv->id);

        if ($rdv->lien_video !== $lien) {
            $rdv->forceFill(['lien_video' => $lien])->save();
        }

        return [
            'room_name' => $roomName,
            'lien_video' => $lien,
        ];
    }
}
