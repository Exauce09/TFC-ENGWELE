<?php

return [
    'fcm' => [
        'server_key' => env('FCM_SERVER_KEY'),
        'enabled' => env('FCM_ENABLED', false),
    ],
    'africas_talking' => [
        'username' => env('AT_USERNAME'),
        'api_key' => env('AT_API_KEY'),
        'from' => env('AT_SENDER_ID', 'AMEN'),
        'enabled' => env('AT_ENABLED', false),
    ],
    'jitsi' => [
        'domain' => env('JITSI_DOMAIN', 'meet.jit.si'),
        'room_prefix' => env('JITSI_ROOM_PREFIX', 'amen-rdv'),
    ],
    'mobile_money' => [
        'airtel_enabled' => env('AIRTEL_MONEY_ENABLED', false),
        'airtel_client_id' => env('AIRTEL_CLIENT_ID'),
        'airtel_client_secret' => env('AIRTEL_CLIENT_SECRET'),
        'mpesa_enabled' => env('MPESA_ENABLED', false),
        'mpesa_consumer_key' => env('MPESA_CONSUMER_KEY'),
        'mpesa_consumer_secret' => env('MPESA_CONSUMER_SECRET'),
        'mock_mode' => env('MOBILE_MONEY_MOCK', true),
    ],
];
