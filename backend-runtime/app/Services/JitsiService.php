<?php

namespace App\Services;

class JitsiService
{
    public function roomName(int $rendezVousId): string
    {
        $prefix = config('integrations.jitsi.room_prefix', 'amen-rdv');
        return $prefix.'-'.$rendezVousId.'-'.substr(md5((string) $rendezVousId), 0, 8);
    }

    public function roomUrl(int $rendezVousId, ?string $displayName = null): string
    {
        $domain = config('integrations.jitsi.domain', 'meet.jit.si');
        $room = $this->roomName($rendezVousId);
        $url = "https://{$domain}/{$room}";

        if ($displayName) {
            $url .= '#userInfo.displayName="'.rawurlencode($displayName).'"';
        }

        return $url;
    }

    public function embedUrl(int $rendezVousId, ?string $displayName = null): string
    {
        $domain = config('integrations.jitsi.domain', 'meet.jit.si');
        $room = $this->roomName($rendezVousId);
        $params = http_build_query(array_filter([
            'jwt' => null,
        ]));
        $base = "https://{$domain}/{$room}";
        if ($displayName) {
            return $base.'#config.prejoinPageEnabled=false&userInfo.displayName='.rawurlencode($displayName);
        }
        return $base.'#config.prejoinPageEnabled=false';
    }
}
