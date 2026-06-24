<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmService
{
    public function send(string $token, string $title, string $body, array $data = []): bool
    {
        if (!config('integrations.fcm.enabled') || !config('integrations.fcm.server_key')) {
            Log::info('[FCM mock]', compact('token', 'title', 'body', 'data'));
            return true;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'key='.config('integrations.fcm.server_key'),
                'Content-Type' => 'application/json',
            ])->post('https://fcm.googleapis.com/fcm/send', [
                'to' => $token,
                'notification' => ['title' => $title, 'body' => $body, 'sound' => 'default'],
                'data' => $data,
            ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error('[FCM error]', ['message' => $e->getMessage()]);
            return false;
        }
    }
}
