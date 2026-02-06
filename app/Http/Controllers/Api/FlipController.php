<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FlipTransaction;
use App\Models\FlipMatch;
use App\Models\FlipTransactionNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class FlipController extends Controller
{
    /* ================================================================== */
    /*  TRANSACTIONS                                                       */
    /* ================================================================== */

    /**
     * List the authenticated user's flip transactions with filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = FlipTransaction::forUser($request->user()->id)
            ->parents() // Only show parent transactions, not sub-sells
            ->with(['items.set', 'items.minifig', 'subTransactions']);

        // Type filter
        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        // Status filter
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        // Platform filter
        if ($platform = $request->get('platform')) {
            $query->where('platform', $platform);
        }

        // Search
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Date range
        if ($from = $request->get('from')) {
            $query->where('transaction_date', '>=', $from);
        }
        if ($to = $request->get('to')) {
            $query->where('transaction_date', '<=', $to);
        }

        // Sorting
        $sortBy = $request->get('sort', 'transaction_date');
        $sortDir = $request->get('direction', 'desc');
        $allowedSorts = ['transaction_date', 'price', 'title', 'created_at', 'status'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        }

        $perPage = min((int) $request->get('per_page', 20), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Store a new flip transaction.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:buy,sell',
            'title' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:5000',
            'platform' => 'nullable|string|max:100',
            'transaction_date' => 'required|date',
            'shipping_cost' => 'nullable|numeric|min:0',
            'fees' => 'nullable|numeric|min:0',
            'items' => 'nullable|array',
            'items.*.item_type' => 'required|in:set,minifig,custom',
            'items.*.set_num' => 'nullable|string|max:50',
            'items.*.fig_num' => 'nullable|string|max:50',
            'items.*.custom_description' => 'nullable|string|max:500',
            'items.*.quantity' => 'nullable|integer|min:1',
            'items.*.estimated_value' => 'nullable|numeric|min:0',
            'items.*.condition' => 'nullable|string|max:50',
        ]);

        $transaction = DB::transaction(function () use ($validated, $request) {
            $transaction = FlipTransaction::create([
                'user_id' => $request->user()->id,
                'type' => $validated['type'],
                'title' => $validated['title'],
                'price' => $validated['price'],
                'notes' => $validated['notes'] ?? null,
                'platform' => $validated['platform'] ?? null,
                'transaction_date' => $validated['transaction_date'],
                'shipping_cost' => $validated['shipping_cost'] ?? 0,
                'fees' => $validated['fees'] ?? 0,
                'status' => 'open',
            ]);

            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    $transaction->items()->create([
                        'item_type' => $item['item_type'],
                        'set_num' => $item['set_num'] ?? null,
                        'fig_num' => $item['fig_num'] ?? null,
                        'custom_description' => $item['custom_description'] ?? null,
                        'quantity' => $item['quantity'] ?? 1,
                        'estimated_value' => $item['estimated_value'] ?? null,
                        'condition' => $item['condition'] ?? null,
                    ]);
                }
            }

            return $transaction->load(['items.set', 'items.minifig']);
        });

        return response()->json($transaction, 201);
    }

    /**
     * Create a sub-sell (sale attached to a parent buy transaction).
     */
    public function storeSubSell(Request $request, string $parentId): JsonResponse
    {
        $parent = FlipTransaction::findOrFail($parentId);

        if (!$parent->belongsToUser($request->user())) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if ($parent->type !== 'buy') {
            return response()->json(['message' => 'Sub-sells can only be added to buy transactions.'], 422);
        }

        if ($parent->parent_id !== null) {
            return response()->json(['message' => 'Cannot add sub-sells to a sub-transaction.'], 422);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:5000',
            'platform' => 'nullable|string|max:100',
            'transaction_date' => 'required|date',
            'shipping_cost' => 'nullable|numeric|min:0',
            'fees' => 'nullable|numeric|min:0',
            'items' => 'nullable|array',
            'items.*.item_type' => 'required|in:set,minifig,custom',
            'items.*.set_num' => 'nullable|string|max:50',
            'items.*.fig_num' => 'nullable|string|max:50',
            'items.*.custom_description' => 'nullable|string|max:500',
            'items.*.quantity' => 'nullable|integer|min:1',
            'items.*.estimated_value' => 'nullable|numeric|min:0',
            'items.*.condition' => 'nullable|string|max:50',
        ]);

        $subSell = DB::transaction(function () use ($validated, $request, $parent) {
            $subSell = FlipTransaction::create([
                'user_id' => $request->user()->id,
                'parent_id' => $parent->id,
                'type' => 'sell',
                'title' => $validated['title'],
                'price' => $validated['price'],
                'notes' => $validated['notes'] ?? null,
                'platform' => $validated['platform'] ?? null,
                'transaction_date' => $validated['transaction_date'],
                'shipping_cost' => $validated['shipping_cost'] ?? 0,
                'fees' => $validated['fees'] ?? 0,
                'status' => 'complete', // Sub-sells are always complete
            ]);

            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    $subSell->items()->create([
                        'item_type' => $item['item_type'],
                        'set_num' => $item['set_num'] ?? null,
                        'fig_num' => $item['fig_num'] ?? null,
                        'custom_description' => $item['custom_description'] ?? null,
                        'quantity' => $item['quantity'] ?? 1,
                        'estimated_value' => $item['estimated_value'] ?? null,
                        'condition' => $item['condition'] ?? null,
                    ]);
                }
            }

            // Recalculate parent status (may auto-complete if all items sold)
            $parent->recalculateStatus();

            return $subSell->load(['items.set', 'items.minifig']);
        });

        return response()->json($subSell, 201);
    }

    /**
     * Show a single transaction with all relationships.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $transaction = FlipTransaction::with([
            'items.set',
            'items.minifig',
            'buyMatches.sellTransaction.items',
            'sellMatches.buyTransaction.items',
        ])->findOrFail($id);

        if (!$transaction->belongsToUser($request->user())) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json([
            'transaction' => $transaction,
            'matched_amount' => $transaction->matched_amount,
            'unmatched_amount' => $transaction->unmatched_amount,
            'total_cost' => $transaction->total_cost,
            'profit' => $transaction->profit,
        ]);
    }

    /**
     * Update a flip transaction.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $transaction = FlipTransaction::findOrFail($id);

        if (!$transaction->belongsToUser($request->user())) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'price' => 'sometimes|numeric|min:0',
            'notes' => 'nullable|string|max:5000',
            'platform' => 'nullable|string|max:100',
            'transaction_date' => 'sometimes|date',
            'shipping_cost' => 'nullable|numeric|min:0',
            'fees' => 'nullable|numeric|min:0',
            'items' => 'nullable|array',
            'items.*.id' => 'nullable|integer',
            'items.*.item_type' => 'required|in:set,minifig,custom',
            'items.*.set_num' => 'nullable|string|max:50',
            'items.*.fig_num' => 'nullable|string|max:50',
            'items.*.custom_description' => 'nullable|string|max:500',
            'items.*.quantity' => 'nullable|integer|min:1',
            'items.*.estimated_value' => 'nullable|numeric|min:0',
            'items.*.condition' => 'nullable|string|max:50',
        ]);

        DB::transaction(function () use ($transaction, $validated) {
            $transaction->update(collect($validated)->except('items')->toArray());

            if (array_key_exists('items', $validated)) {
                // Sync items: delete removed, update existing, create new
                $existingIds = [];
                foreach ($validated['items'] as $item) {
                    if (!empty($item['id'])) {
                        $transaction->items()->where('id', $item['id'])->update($item);
                        $existingIds[] = $item['id'];
                    } else {
                        $newItem = $transaction->items()->create($item);
                        $existingIds[] = $newItem->id;
                    }
                }
                // Delete items not in the updated list
                $transaction->items()->whereNotIn('id', $existingIds)->delete();
            }

            $transaction->recalculateStatus();
        });

        return response()->json(
            $transaction->fresh(['items.set', 'items.minifig'])
        );
    }

    /**
     * Delete a flip transaction and all related data.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $transaction = FlipTransaction::findOrFail($id);

        if (!$transaction->belongsToUser($request->user())) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        DB::transaction(function () use ($transaction) {
            // Delete matches (and update counter-transaction statuses)
            $matchIds = $transaction->type === 'buy'
                ? $transaction->buyMatches()->pluck('id')
                : $transaction->sellMatches()->pluck('id');

            $counterField = $transaction->type === 'buy' ? 'sell_transaction_id' : 'buy_transaction_id';
            $counterIds = FlipMatch::whereIn('id', $matchIds)->pluck($counterField)->unique();

            $transaction->delete(); // Cascades items & matches

            // Recalculate counter-transaction statuses
            FlipTransaction::whereIn('id', $counterIds)->each(fn($t) => $t->recalculateStatus());
        });

        return response()->json(['message' => 'Transaction deleted.']);
    }

    /* ================================================================== */
    /*  MATCHING                                                           */
    /* ================================================================== */

    /**
     * Get candidate transactions for matching against a given transaction.
     */
    public function matchCandidates(Request $request, string $id): JsonResponse
    {
        $transaction = FlipTransaction::findOrFail($id);

        if (!$transaction->belongsToUser($request->user())) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $counterType = $transaction->type === 'buy' ? 'sell' : 'buy';

        $candidates = FlipTransaction::forUser($request->user()->id)
            ->where('type', $counterType)
            ->whereIn('status', ['open', 'partial'])
            ->with('items.set', 'items.minifig')
            ->orderBy('transaction_date', 'desc')
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'title' => $t->title,
                    'price' => $t->price,
                    'transaction_date' => $t->transaction_date,
                    'platform' => $t->platform,
                    'status' => $t->status,
                    'unmatched_amount' => $t->unmatched_amount,
                    'items' => $t->items,
                ];
            });

        return response()->json($candidates);
    }

    /**
     * Create a match between a buy and sell transaction.
     */
    public function createMatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'buy_transaction_id' => 'required|integer',
            'sell_transaction_id' => 'required|integer',
            'buy_amount' => 'required|numeric|min:0.01',
            'sell_amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
            'items' => 'nullable|array',
            'items.*.flip_transaction_item_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $buy = FlipTransaction::findOrFail($validated['buy_transaction_id']);
        $sell = FlipTransaction::findOrFail($validated['sell_transaction_id']);

        // Verify ownership
        if (!$buy->belongsToUser($request->user()) || !$sell->belongsToUser($request->user())) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        // Verify types
        if ($buy->type !== 'buy' || $sell->type !== 'sell') {
            return response()->json(['message' => 'Invalid transaction types for matching.'], 422);
        }

        // Only validate sell amount doesn't exceed sell's unmatched
        if ($validated['sell_amount'] > $sell->unmatched_amount + 0.01) {
            return response()->json(['message' => 'Sell amount exceeds the sale\'s unmatched balance.'], 422);
        }

        $match = DB::transaction(function () use ($validated, $buy, $sell) {
            $match = FlipMatch::create([
                'buy_transaction_id' => $buy->id,
                'sell_transaction_id' => $sell->id,
                'buy_amount' => $validated['buy_amount'],
                'sell_amount' => $validated['sell_amount'],
                'notes' => $validated['notes'] ?? null,
            ]);

            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    $match->matchItems()->create($item);
                }
            }

            $buy->recalculateStatus();
            $sell->recalculateStatus();

            return $match->load(['buyTransaction', 'sellTransaction', 'matchItems.transactionItem']);
        });

        return response()->json($match, 201);
    }

    /**
     * Delete a match and update transaction statuses.
     */
    public function deleteMatch(Request $request, string $id): JsonResponse
    {
        $match = FlipMatch::with(['buyTransaction', 'sellTransaction'])->findOrFail($id);

        if (!$match->buyTransaction->belongsToUser($request->user())) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        DB::transaction(function () use ($match) {
            $buy = $match->buyTransaction;
            $sell = $match->sellTransaction;
            $match->delete();
            $buy->recalculateStatus();
            $sell->recalculateStatus();
        });

        return response()->json(['message' => 'Match removed.']);
    }

    /* ================================================================== */
    /*  COMPLETE / REOPEN                                                  */
    /* ================================================================== */

    /**
     * Manually mark a transaction as complete.
     */
    public function complete(Request $request, string $id): JsonResponse
    {
        $transaction = FlipTransaction::findOrFail($id);

        if (!$transaction->belongsToUser($request->user())) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $transaction->markComplete();

        return response()->json(['message' => 'Transaction marked as complete.', 'status' => 'complete']);
    }

    /**
     * Re-open a completed transaction.
     */
    public function reopen(Request $request, string $id): JsonResponse
    {
        $transaction = FlipTransaction::findOrFail($id);

        if (!$transaction->belongsToUser($request->user())) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $transaction->reopen();

        return response()->json(['message' => 'Transaction re-opened.', 'status' => $transaction->status]);
    }

    /* ================================================================== */
    /*  TRANSACTION NOTES                                                  */
    /* ================================================================== */

    /**
     * Add a note to a transaction.
     */
    public function addNote(Request $request, string $id): JsonResponse
    {
        $transaction = FlipTransaction::findOrFail($id);

        if (!$transaction->belongsToUser($request->user())) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        $note = $transaction->transactionNotes()->create([
            'content' => $validated['content'],
        ]);

        return response()->json($note, 201);
    }

    /**
     * Delete a transaction note.
     */
    public function deleteNote(Request $request, string $transactionId, string $noteId): JsonResponse
    {
        $transaction = FlipTransaction::findOrFail($transactionId);

        if (!$transaction->belongsToUser($request->user())) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $note = $transaction->transactionNotes()->findOrFail($noteId);
        $note->delete();

        return response()->json(['message' => 'Note deleted.']);
    }

    /* ================================================================== */
    /*  STATISTICS                                                         */
    /* ================================================================== */

    /**
     * Get comprehensive flipping statistics for the user.
     */
    public function stats(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Transaction counts
        $totalBuys = FlipTransaction::forUser($userId)->buys()->count();
        $totalSells = FlipTransaction::forUser($userId)->sells()->count();

        // Financial totals
        $totalBuyAmount = (float) FlipTransaction::forUser($userId)->buys()->sum('price');
        $totalSellAmount = (float) FlipTransaction::forUser($userId)->sells()->sum('price');
        $totalShippingCost = (float) FlipTransaction::forUser($userId)->sum('shipping_cost');
        $totalFees = (float) FlipTransaction::forUser($userId)->sum('fees');

        // Profit from completed matches
        $matches = FlipMatch::whereHas('buyTransaction', fn($q) => $q->where('user_id', $userId))->get();
        $totalProfit = $matches->sum(fn($m) => (float) $m->sell_amount - (float) $m->buy_amount);
        $totalMatchedBuy = $matches->sum('buy_amount');
        $totalMatchedSell = $matches->sum('sell_amount');

        // Status breakdown
        $openBuys = FlipTransaction::forUser($userId)->buys()->open()->count();
        $openSells = FlipTransaction::forUser($userId)->sells()->open()->count();
        $completeBuys = FlipTransaction::forUser($userId)->buys()->complete()->count();
        $completeSells = FlipTransaction::forUser($userId)->sells()->complete()->count();

        // Platform breakdown
        $platformStats = FlipTransaction::forUser($userId)
            ->select('platform', DB::raw('count(*) as count'), DB::raw('sum(price) as total'))
            ->groupBy('platform')
            ->get();

        // Monthly trend (last 12 months)
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

        // Average profit margin on matched deals
        $avgMargin = $totalMatchedBuy > 0
            ? ($totalProfit / $totalMatchedBuy) * 100
            : 0;

        // Inventory value (unmatched buys)
        $inventoryValue = (float) FlipTransaction::forUser($userId)
            ->buys()
            ->whereIn('status', ['open', 'partial'])
            ->sum('price');

        // Best flip (highest profit match)
        $bestFlip = $matches->sortByDesc(fn($m) => (float) $m->sell_amount - (float) $m->buy_amount)->first();

        return response()->json([
            'overview' => [
                'total_buys' => $totalBuys,
                'total_sells' => $totalSells,
                'total_buy_amount' => round($totalBuyAmount, 2),
                'total_sell_amount' => round($totalSellAmount, 2),
                'total_shipping_cost' => round($totalShippingCost, 2),
                'total_fees' => round($totalFees, 2),
                'total_profit' => round($totalProfit, 2),
                'avg_margin' => round($avgMargin, 1),
                'inventory_value' => round($inventoryValue, 2),
            ],
            'status' => [
                'open_buys' => $openBuys,
                'open_sells' => $openSells,
                'complete_buys' => $completeBuys,
                'complete_sells' => $completeSells,
            ],
            'platform_stats' => $platformStats,
            'monthly_trend' => $monthlyTrend,
            'best_flip' => $bestFlip ? [
                'buy_amount' => $bestFlip->buy_amount,
                'sell_amount' => $bestFlip->sell_amount,
                'profit' => round((float) $bestFlip->sell_amount - (float) $bestFlip->buy_amount, 2),
                'buy_title' => $bestFlip->buyTransaction?->title,
                'sell_title' => $bestFlip->sellTransaction?->title,
            ] : null,
        ]);
    }

    /**
     * Get list of platforms used by the user.
     */
    public function platforms(Request $request): JsonResponse
    {
        $platforms = FlipTransaction::forUser($request->user()->id)
            ->whereNotNull('platform')
            ->distinct()
            ->pluck('platform');

        return response()->json($platforms);
    }
}
