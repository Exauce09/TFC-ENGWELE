<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Notifications',
            'data' => $notifications->items(),
            'meta' => [
                'total' => $notifications->total(),
                'per_page' => $notifications->perPage(),
                'current_page' => $notifications->currentPage(),
            ],
        ]);
    }

    public function marquerLu(Request $request, int $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $notification->update(['lu' => true, 'lu_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marquee comme lue',
            'data' => $notification,
        ]);
    }

    public function toutLire(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)->where('lu', false)->update(['lu' => true, 'lu_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Toutes les notifications sont lues',
            'data' => null,
        ]);
    }
}
