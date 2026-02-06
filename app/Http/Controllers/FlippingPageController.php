<?php

namespace App\Http\Controllers;

use App\Models\FlipMatch;
use App\Models\FlipTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Handles Inertia page rendering for the LEGO Flipping system.
 * Data is passed via server-side props for instant hydration.
 */
class FlippingPageController extends Controller
{
  /**
   * Main flipping dashboard with stats and recent transactions.
   */
  public function index(Request $request): Response
  {
    $user = $request->user();
    $userId = $user->id;

    // Stats overview
    $stats = $this->getStats($userId);

    // Recent transactions
    $transactions = FlipTransaction::forUser($userId)
      ->with(['items.set', 'items.minifig'])
      ->orderByDesc('transaction_date')
      ->paginate(20);

    // Apply filters from query params
    $query = FlipTransaction::forUser($userId)
      ->parents() // Only show parent transactions, not sub-sells
      ->with([
        'items.set',
        'items.minifig',
        'subTransactions.items.set',
        'subTransactions.items.minifig',
      ]);

    if ($type = $request->get('type')) {
      $query->where('type', $type);
    }
    if ($status = $request->get('status')) {
      $query->where('status', $status);
    }
    if ($search = $request->get('search')) {
      $query->where(function ($q) use ($search) {
        $q->where('title', 'like', "%{$search}%")
          ->orWhere('notes', 'like', "%{$search}%");
      });
    }
    if ($platform = $request->get('platform')) {
      $query->where('platform', $platform);
    }

    $sortBy = $request->get('sort', 'transaction_date');
    $sortDir = $request->get('direction', 'desc');
    $allowedSorts = ['transaction_date', 'price', 'title', 'created_at', 'status'];
    if (in_array($sortBy, $allowedSorts)) {
      $query->orderBy($sortBy, $sortDir);
    }

    $transactions = $query->paginate(20)->withQueryString();

    // Platforms used
    $platforms = FlipTransaction::forUser($userId)
      ->whereNotNull('platform')
      ->where('platform', '!=', '')
      ->distinct()
      ->pluck('platform');

    // Get analytics data for reports
    $topSets = $this->getTopSets($userId);
    $platformStats = $this->getPlatformStats($userId);

    return Inertia::render('Dashboard/Flipping', [
      'stats' => $stats,
      'transactions' => $transactions,
      'platforms' => $platforms,
      'filters' => $request->only(['type', 'status', 'search', 'platform', 'sort', 'direction']),
      'topSets' => $topSets,
      'platformAnalytics' => $platformStats,
      'flipLimits' => [
        'is_pro' => $user->isPro(),
        'remaining' => $user->remainingFlipTransactions(),
        'limit' => $user->isPro() ? null : (int) \App\Models\SiteSetting::getValue('free_flip_transaction_limit', 100),
      ],
    ]);
  }

  /**
   * Show a single transaction detail with matching info.
   */
  public function show(Request $request, string $id): Response
  {
    $transaction = FlipTransaction::with([
      'items.set.theme',
      'items.minifig',
      'transactionNotes',
      'subTransactions.items.set',
      'subTransactions.items.minifig',
      'parent.items.set',
      'parent.items.minifig',
    ])->findOrFail($id);

    if (!$transaction->belongsToUser($request->user())) {
      abort(404);
    }

    return Inertia::render('FlippingDetail', [
      'transaction' => $transaction,
      'totalCost' => $transaction->total_cost,
      'subSellTotal' => $transaction->sub_sell_total,
      'subShippingTotal' => $transaction->sub_shipping_total,
      'subFeesTotal' => $transaction->sub_fees_total,
      'subProfit' => $transaction->sub_profit,
      'hasOnlyTrackableItems' => $transaction->has_only_trackable_items,
      'hasCustomItems' => $transaction->has_custom_items,
    ]);
  }

  /**
   * Get comprehensive stats for the user.
   */
  private function getStats(int $userId): array
  {
    $totalBuyAmount = (float) FlipTransaction::forUser($userId)->buys()->sum('price');
    $totalSellAmount = (float) FlipTransaction::forUser($userId)->sells()->sum('price');
    $totalShipping = (float) FlipTransaction::forUser($userId)->sum('shipping_cost');
    $totalFees = (float) FlipTransaction::forUser($userId)->sum('fees');

    // Calculate profit from matched transactions (FlipMatch)
    $matches = FlipMatch::with('buyTransaction', 'sellTransaction')
      ->whereHas('buyTransaction', fn($q) => $q->where('user_id', $userId))
      ->get();

    $matchProfit = $matches->sum(function ($m) {
      $sellAmount = (float) $m->sell_amount;
      $buyAmount = (float) $m->buy_amount;
      $buyTransaction = $m->buyTransaction;
      $sellTransaction = $m->sellTransaction;

      // Pro-rate buy shipping and fees based on the matched amount
      $buyMatchRatio = $buyAmount / max((float) $buyTransaction->price, 0.01);
      $allocatedBuyCosts = (($buyTransaction->shipping_cost + $buyTransaction->fees) * $buyMatchRatio);

      // Subtract sell transaction's fees and shipping from the sell amount
      $sellMatchRatio = $sellAmount / max((float) $sellTransaction->price, 0.01);
      $allocatedSellCosts = (($sellTransaction->shipping_cost + $sellTransaction->fees) * $sellMatchRatio);

      // Profit = sell revenue - sell costs - buy cost - buy costs
      return $sellAmount - $allocatedSellCosts - $buyAmount - $allocatedBuyCosts;
    });

    // Calculate profit from sub-transactions (sells attached to parent buys)
    $parentBuys = FlipTransaction::forUser($userId)
      ->buys()
      ->parents()
      ->with('subTransactions')
      ->get();

    $subTransactionProfit = $parentBuys->sum(function ($buy) {
      $sellTotal = (float) $buy->subTransactions->sum('price');
      if ($sellTotal <= 0) {
        return 0;
      }

      $subFees = (float) $buy->subTransactions->sum('fees');
      $subShipping = (float) $buy->subTransactions->sum('shipping_cost');
      $buyCost = (float) $buy->price + (float) $buy->shipping_cost + (float) $buy->fees;

      return $sellTotal - $buyCost - $subFees - $subShipping;
    });

    // Total profit includes both match-based and sub-transaction profit
    $totalProfit = $matchProfit + $subTransactionProfit;

    $totalMatchedBuy = (float) $matches->sum('buy_amount');
    $totalSubTransactionBuy = (float) $parentBuys->filter(fn($b) => $b->subTransactions->isNotEmpty())->sum('price');
    $totalInvestedInFlips = $totalMatchedBuy + $totalSubTransactionBuy;

    $completedMatches = $matches->count(); // Number of completed flips via matches
    $completedSubFlips = $parentBuys->filter(fn($b) => $b->subTransactions->isNotEmpty())->count();
    $totalCompletedFlips = $completedMatches + $completedSubFlips;

    $inventoryValue = (float) FlipTransaction::forUser($userId)
      ->buys()
      ->whereIn('status', ['open', 'partial'])
      ->sum('price');

    $avgMargin = $totalInvestedInFlips > 0
      ? ($totalProfit / $totalInvestedInFlips) * 100
      : 0;

    // Monthly trend
    $dateFormat = DB::getDriverName() === 'sqlite'
      ? "strftime('%Y-%m', transaction_date)"
      : "DATE_FORMAT(transaction_date, '%Y-%m')";

    $monthlyTrend = FlipTransaction::forUser($userId)
      ->where('transaction_date', '>=', now()->subMonths(12))
      ->select(
        DB::raw("{$dateFormat} as month"),
        'type',
        DB::raw('count(*) as count'),
        DB::raw('sum(price) as total'),
      )
      ->groupBy(DB::raw($dateFormat), 'type')
      ->orderBy(DB::raw($dateFormat))
      ->get();

    return [
      'total_buys' => FlipTransaction::forUser($userId)->buys()->count(),
      'total_sells' => FlipTransaction::forUser($userId)->sells()->count(),
      'total_buy_amount' => round($totalBuyAmount, 2),
      'total_sell_amount' => round($totalSellAmount, 2),
      'total_shipping' => round($totalShipping, 2),
      'total_fees' => round($totalFees, 2),
      'total_profit' => round($totalProfit, 2),
      'avg_margin' => round($avgMargin, 1),
      'inventory_value' => round($inventoryValue, 2),
      'open_buys' => FlipTransaction::forUser($userId)->buys()->open()->count(),
      'open_sells' => FlipTransaction::forUser($userId)->sells()->open()->count(),
      'complete_count' => FlipTransaction::forUser($userId)->complete()->count(),
      'completed_matches' => $totalCompletedFlips, // Total flips (matches + sub-transactions)
      'monthly_trend' => $monthlyTrend,
    ];
  }

  /**
   * Get top performing sets analytics.
   */
  private function getTopSets(int $userId): array
  {
    $setPerformance = [];

    // 1. Get sets from FlipMatch records
    $matches = FlipMatch::with(['buyTransaction.items.set', 'sellTransaction.items'])
      ->whereHas('buyTransaction', fn($q) => $q->where('user_id', $userId))
      ->get();

    foreach ($matches as $match) {
      if (!$match->buyTransaction || !$match->buyTransaction->items) {
        continue;
      }

      foreach ($match->buyTransaction->items as $item) {
        if ($item->item_type === 'set' && $item->set_num) {
          $setNum = $item->set_num;

          if (!isset($setPerformance[$setNum])) {
            $setPerformance[$setNum] = [
              'set_num' => $setNum,
              'set_name' => $item->set?->name ?? 'Set ' . $setNum,
              'total_flips' => 0,
              'total_profit' => 0,
              'total_sold' => 0,
            ];
          }

          $sellAmount = (float) $match->sell_amount;
          $buyAmount = (float) $match->buy_amount;
          $buyTransaction = $match->buyTransaction;
          $sellTransaction = $match->sellTransaction;

          $buyMatchRatio = $buyAmount / max((float) $buyTransaction->price, 0.01);
          $allocatedBuyCosts = (($buyTransaction->shipping_cost + $buyTransaction->fees) * $buyMatchRatio);

          $sellMatchRatio = $sellAmount / max((float) $sellTransaction->price, 0.01);
          $allocatedSellCosts = (($sellTransaction->shipping_cost + $sellTransaction->fees) * $sellMatchRatio);

          $profit = $sellAmount - $allocatedSellCosts - $buyAmount - $allocatedBuyCosts;

          $setPerformance[$setNum]['total_flips']++;
          $setPerformance[$setNum]['total_profit'] += $profit;
          $setPerformance[$setNum]['total_sold'] += $sellAmount;
        }
      }
    }

    // 2. Get sets from sub-transaction system (parent buys with sub-sells)
    $parentBuys = FlipTransaction::forUser($userId)
      ->buys()
      ->parents()
      ->with(['items.set', 'subTransactions.items.set'])
      ->get();

    foreach ($parentBuys as $buy) {
      if ($buy->subTransactions->isEmpty() || $buy->items->isEmpty()) {
        continue;
      }

      foreach ($buy->items as $item) {
        if ($item->item_type === 'set' && $item->set_num) {
          $setNum = $item->set_num;

          if (!isset($setPerformance[$setNum])) {
            $setPerformance[$setNum] = [
              'set_num' => $setNum,
              'set_name' => $item->set?->name ?? 'Set ' . $setNum,
              'total_flips' => 0,
              'total_profit' => 0,
              'total_sold' => 0,
            ];
          }

          // Calculate profit for this sub-transaction flip
          $sellTotal = (float) $buy->subTransactions->sum('price');
          $subFees = (float) $buy->subTransactions->sum('fees');
          $subShipping = (float) $buy->subTransactions->sum('shipping_cost');
          $buyCost = (float) $buy->price + (float) $buy->shipping_cost + (float) $buy->fees;

          $profit = $sellTotal - $buyCost - $subFees - $subShipping;

          $setPerformance[$setNum]['total_flips']++;
          $setPerformance[$setNum]['total_profit'] += $profit;
          $setPerformance[$setNum]['total_sold'] += $sellTotal;
        }
      }
    }

    // Calculate average margin for each set
    foreach ($setPerformance as $setNum => &$data) {
      $data['avg_margin'] = $data['total_sold'] > 0
        ? ($data['total_profit'] / $data['total_sold']) * 100
        : 0;
    }

    // Sort by total profit descending
    usort($setPerformance, fn($a, $b) => $b['total_profit'] <=> $a['total_profit']);

    return array_slice($setPerformance, 0, 10);
  }

  /**
   * Get platform performance analytics.
   */
  private function getPlatformStats(int $userId): array
  {
    $platforms = FlipTransaction::forUser($userId)
      ->whereNotNull('platform')
      ->where('platform', '!=', '')
      ->select('platform')
      ->distinct()
      ->pluck('platform');

    $platformStats = [];

    foreach ($platforms as $platform) {
      $buys = FlipTransaction::forUser($userId)
        ->buys()
        ->where('platform', $platform)
        ->get();

      $sells = FlipTransaction::forUser($userId)
        ->sells()
        ->where('platform', $platform)
        ->get();

      $totalBuyAmount = $buys->sum('price');
      $totalSellAmount = $sells->sum('price');

      // Calculate platform-specific profit from matches
      $matches = FlipMatch::with(['buyTransaction', 'sellTransaction'])
        ->whereHas('buyTransaction', function ($q) use ($userId, $platform) {
          $q->where('user_id', $userId)->where('platform', $platform);
        })
        ->orWhereHas('sellTransaction', function ($q) use ($userId, $platform) {
          $q->where('user_id', $userId)->where('platform', $platform);
        })
        ->get();

      $matchProfit = $matches->sum(function ($m) {
        $sellAmount = (float) $m->sell_amount;
        $buyAmount = (float) $m->buy_amount;
        $buyTransaction = $m->buyTransaction;
        $sellTransaction = $m->sellTransaction;

        $buyMatchRatio = $buyAmount / max((float) $buyTransaction->price, 0.01);
        $allocatedBuyCosts = (($buyTransaction->shipping_cost + $buyTransaction->fees) * $buyMatchRatio);

        $sellMatchRatio = $sellAmount / max((float) $sellTransaction->price, 0.01);
        $allocatedSellCosts = (($sellTransaction->shipping_cost + $sellTransaction->fees) * $sellMatchRatio);

        return $sellAmount - $allocatedSellCosts - $buyAmount - $allocatedBuyCosts;
      });

      // Calculate platform-specific profit from sub-transactions
      $parentBuys = FlipTransaction::forUser($userId)
        ->buys()
        ->parents()
        ->where('platform', $platform)
        ->with('subTransactions')
        ->get();

      $subProfit = $parentBuys->sum(function ($buy) {
        $sellTotal = (float) $buy->subTransactions->sum('price');
        if ($sellTotal <= 0) {
          return 0;
        }

        $subFees = (float) $buy->subTransactions->sum('fees');
        $subShipping = (float) $buy->subTransactions->sum('shipping_cost');
        $buyCost = (float) $buy->price + (float) $buy->shipping_cost + (float) $buy->fees;

        return $sellTotal - $buyCost - $subFees - $subShipping;
      });

      $totalProfit = $matchProfit + $subProfit;

      $platformStats[] = [
        'platform' => $platform,
        'buy_count' => $buys->count(),
        'sell_count' => $sells->count(),
        'total_buy_amount' => round((float) $totalBuyAmount, 2),
        'total_sell_amount' => round((float) $totalSellAmount, 2),
        'profit' => round($totalProfit, 2),
      ];
    }

    // Sort by profit descending
    usort($platformStats, fn($a, $b) => $b['profit'] <=> $a['profit']);

    return $platformStats;
  }
}
