<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    public function send(string $phone, string $message): bool
    {
        $phone = $this->normalizePhone($phone);

        if (!config('integrations.africas_talking.enabled') || !config('integrations.africas_talking.api_key')) {
            Log::info('[SMS mock AfricasTalking]', compact('phone', 'message'));
            return true;
        }

        try {
            $response = Http::withHeaders([
                'apiKey' => config('integrations.africas_talking.api_key'),
                'Content-Type' => 'application/x-www-form-urlencoded',
                'Accept' => 'application/json',
            ])->asForm()->post('https://api.africastalking.com/version1/messaging', [
                'username' => config('integrations.africas_talking.username'),
                'to' => $phone,
                'message' => $message,
                'from' => config('integrations.africas_talking.from'),
            ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error('[SMS error]', ['message' => $e->getMessage()]);
            return false;
        }
    }

    private function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/\s+/', '', $phone);
        if (str_starts_with($phone, '0')) {
            return '+243'.substr($phone, 1);
        }
        if (!str_starts_with($phone, '+')) {
            return '+'.$phone;
        }
        return $phone;
    }
}
