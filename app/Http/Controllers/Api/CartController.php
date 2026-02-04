<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Moc;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
  /**
   * Get the user's cart items.
   */
  public function index(Request $request): JsonResponse
  {
    $cartItems = CartItem::where('user_id', $request->user()->id)
      ->with(['moc' => function ($query) {
        $query->select('id', 'set_num', 'name', 'description', 'price', 'user_id', 'total_parts', 'total_steps')
          ->with(['user:id,name', 'images']);
      }])
      ->get();

    $items = $cartItems->map(function ($cartItem) {
      return [
        'id' => $cartItem->id,
        'moc_id' => $cartItem->moc_id,
        'moc' => $cartItem->moc ? [
          'id' => $cartItem->moc->id,
          'set_num' => $cartItem->moc->set_num,
          'name' => $cartItem->moc->name,
          'description' => $cartItem->moc->description,
          'price' => $cartItem->moc->price,
          'thumbnail' => $cartItem->moc->thumbnail,
          'total_parts' => $cartItem->moc->total_parts,
          'total_steps' => $cartItem->moc->total_steps,
          'user' => $cartItem->moc->user ? [
            'id' => $cartItem->moc->user->id,
            'name' => $cartItem->moc->user->name,
          ] : null,
        ] : null,
        'created_at' => $cartItem->created_at,
      ];
    })->filter(fn($item) => $item['moc'] !== null);

    // Calculate totals
    $subtotal = $items->sum(fn($item) => (float) ($item['moc']['price'] ?? 0));
    $platformFee = $subtotal * config('stripe.platform_fee_percentage', 0.05);

    return response()->json([
      'items' => $items->values(),
      'subtotal' => round($subtotal, 2),
      'platform_fee' => round($platformFee, 2),
      'total' => round($subtotal, 2), // Customer pays full price
      'count' => $items->count(),
    ]);
  }

  /**
   * Add an item to the cart.
   */
  public function store(Request $request): JsonResponse
  {
    $request->validate([
      'moc_id' => 'required|exists:mocs,id',
    ]);

    $moc = Moc::findOrFail($request->moc_id);

    // Check if MOC is public
    if (!$moc->is_public) {
      return response()->json([
        'message' => 'This MOC is not available for purchase.',
      ], 403);
    }

    // Check if MOC has a price (not free)
    if ($moc->isFree()) {
      return response()->json([
        'message' => 'Free MOCs cannot be added to cart. You can claim them directly.',
      ], 400);
    }

    // Check if user already owns the MOC
    if ($request->user()->ownsMoc($moc)) {
      return response()->json([
        'message' => 'You already own this MOC.',
      ], 400);
    }

    // Check if user is trying to buy their own MOC
    if ($moc->user_id === $request->user()->id) {
      return response()->json([
        'message' => 'You cannot purchase your own MOC.',
      ], 400);
    }

    // Check if already in cart
    $existing = CartItem::where('user_id', $request->user()->id)
      ->where('moc_id', $request->moc_id)
      ->first();

    if ($existing) {
      return response()->json([
        'message' => 'This MOC is already in your cart.',
      ], 400);
    }

    $cartItem = CartItem::create([
      'user_id' => $request->user()->id,
      'moc_id' => $request->moc_id,
    ]);

    return response()->json([
      'message' => 'Added to cart.',
      'cart_item_id' => $cartItem->id,
    ], 201);
  }

  /**
   * Remove an item from the cart.
   */
  public function destroy(Request $request, string $id): JsonResponse
  {
    $cartItem = CartItem::where('user_id', $request->user()->id)
      ->where('moc_id', $id)
      ->first();

    if (!$cartItem) {
      return response()->json([
        'message' => 'Item not found in cart.',
      ], 404);
    }

    $cartItem->delete();

    return response()->json([
      'message' => 'Removed from cart.',
    ]);
  }

  /**
   * Clear all items from the cart.
   */
  public function clear(Request $request): JsonResponse
  {
    CartItem::where('user_id', $request->user()->id)->delete();

    return response()->json([
      'message' => 'Cart cleared.',
    ]);
  }

  /**
   * Check if a MOC is in the cart.
   */
  public function check(Request $request, string $id): JsonResponse
  {
    $inCart = CartItem::where('user_id', $request->user()->id)
      ->where('moc_id', $id)
      ->exists();

    return response()->json([
      'in_cart' => $inCart,
    ]);
  }

  /**
   * Get the cart item count.
   */
  public function count(Request $request): JsonResponse
  {
    $count = CartItem::where('user_id', $request->user()->id)->count();

    return response()->json([
      'count' => $count,
    ]);
  }
}
