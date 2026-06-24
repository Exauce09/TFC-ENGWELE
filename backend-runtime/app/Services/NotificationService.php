<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    public function __construct(
        private FcmService $fcm,
        private SmsService $sms,
    ) {}

    public function notify(
        User $user,
        string $titre,
        string $message,
        string $type = 'system',
        array $data = [],
        bool $sendSms = false,
        bool $sendPush = true,
    ): Notification {
        $notification = Notification::create([
            'user_id' => $user->id,
            'titre' => $titre,
            'message' => $message,
            'type' => $type,
            'data' => $data,
            'canal' => $sendSms ? 'sms' : 'app',
        ]);

        if ($sendPush && $user->fcm_token) {
            $this->fcm->send($user->fcm_token, $titre, $message, $data);
        }

        if ($sendSms && $user->phone) {
            $this->sms->send($user->phone, "{$titre}: {$message}");
        }

        return $notification;
    }
}
