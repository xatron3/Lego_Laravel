<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\SellerEarning;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SellerController extends Controller
{
  /**
   * Get seller analytics and earnings overview.
   */
  public function analytics(Request $request): JsonResponse
  {
    $user = $request->user();

    // Get earnings summary
    $totalEarnings = SellerEarning::where('user_id', $user->id)->sum('amount');
    $pendingEarnings = SellerEarning::where('user_id', $user->id)
      ->where('status', 'pending')
      ->sum('amount');
    $paidEarnings = SellerEarning::where('user_id', $user->id)
      ->where('status', 'paid')
      ->sum('amount');

    // Get sales count
    $totalSales = OrderItem::where('seller_id', $user->id)
      ->whereHas('order', function ($query) {
        $query->where('status', 'completed');
      })
      ->count();

    // Get revenue by MOC
    $topMocs = OrderItem::where('seller_id', $user->id)
      ->whereHas('order', function ($query) {
        $query->where('status', 'completed');
      })
      ->select('moc_id', DB::raw('COUNT(*) as sales_count'), DB::raw('SUM(seller_amount) as revenue'))
      ->with(['moc:id,set_num,name,price', 'moc.images'])
      ->groupBy('moc_id')
      ->orderBy('revenue', 'desc')
      ->limit(5)
      ->get();

    // Get recent sales (last 10)
    $recentSales = OrderItem::where('seller_id', $user->id)
      ->whereHas('order', function ($query) {
        $query->where('status', 'completed');
      })
      ->with(['order.user:id,name', 'moc:id,set_num,name', 'moc.images'])
      ->orderBy('created_at', 'desc')
      ->limit(10)
      ->get()
      ->map(function ($item) {
        return [
          'id' => $item->id,
          'moc_name' => $item->moc->name ?? 'Unknown',
          'moc_thumbnail' => $item->moc?->thumbnail,
          'buyer_name' => $item->order->user->name ?? 'Unknown',
          'amount' => $item->seller_amount,
          'date' => $item->created_at,
        ];
      });

    // Get sales over time (last 30 days)
    $salesChart = OrderItem::where('seller_id', $user->id)
      ->whereHas('order', function ($query) {
        $query->where('status', 'completed')
          ->where('created_at', '>=', now()->subDays(30));
      })
      ->select(
        DB::raw('DATE(order_items.created_at) as date'),
        DB::raw('COUNT(*) as count'),
        DB::raw('SUM(seller_amount) as revenue')
      )
      ->groupBy('date')
      ->orderBy('date', 'asc')
      ->get();

    return response()->json([
      'summary' => [
        'total_earnings' => round($totalEarnings, 2),
        'pending_earnings' => round($pendingEarnings, 2),
        'paid_earnings' => round($paidEarnings, 2),
        'total_sales' => $totalSales,
      ],
      'top_mocs' => $topMocs->map(function ($item) {
        return [
          'moc_id' => $item->moc_id,
          'moc_name' => $item->moc->name ?? 'Unknown',
          'moc_thumbnail' => $item->moc?->thumbnail,
          'moc_price' => $item->moc->price ?? 0,
          'sales_count' => $item->sales_count,
          'revenue' => round($item->revenue, 2),
        ];
      }),
      'recent_sales' => $recentSales,
      'sales_chart' => $salesChart,
    ]);
  }

  /**
   * Get detailed earnings history.
   */
  public function earnings(Request $request): JsonResponse
  {
    $earnings = SellerEarning::where('user_id', $request->user()->id)
      ->with(['orderItem.moc:id,set_num,name', 'orderItem.moc.images', 'orderItem.order.user:id,name'])
      ->orderBy('created_at', 'desc')
      ->paginate(20);

    return response()->json($earnings);
  }
}
