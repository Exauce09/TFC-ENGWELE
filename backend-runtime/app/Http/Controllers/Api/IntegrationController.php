<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntegrationController extends Controller
{
    public function status(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Statut des integrations',
            'data' => [
                'fcm' => [
                    'enabled' => (bool) config('integrations.fcm.enabled'),
                    'configured' => (bool) config('integrations.fcm.server_key'),
                ],
                'sms' => [
                    'enabled' => (bool) config('integrations.africas_talking.enabled'),
                    'configured' => (bool) config('integrations.africas_talking.api_key'),
                    'provider' => 'AfricasTalking',
                ],
                'jitsi' => [
                    'domain' => config('integrations.jitsi.domain'),
                    'enabled' => true,
                ],
                'mobile_money' => [
                    'mock_mode' => (bool) config('integrations.mobile_money.mock_mode'),
                    'airtel' => (bool) config('integrations.mobile_money.airtel_enabled'),
                    'mpesa' => (bool) config('integrations.mobile_money.mpesa_enabled'),
                ],
            ],
        ]);
    }

    public function registerFcmToken(Request $request): JsonResponse
    {
        $validated = $request->validate(['fcm_token' => 'required|string|max:500']);
        $request->user()->update(['fcm_token' => $validated['fcm_token']]);

        return response()->json([
            'success' => true,
            'message' => 'Token FCM enregistre',
            'data' => null,
        ]);
    }
}
