<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\SellerEarning;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Webhook;

class CheckoutController extends Controller
{
  public function __construct()
  {
    Stripe::setApiKey(config('stripe.secret'));
  }

  /**
   * Create a Stripe Checkout session for the user's cart.
   */
  public function createSession(Request $request): JsonResponse
  {
    $user = $request->user();

    // Get cart items with MOCs
    $cartItems = CartItem::where('user_id', $user->id)
      ->with(['moc.user'])
      ->get();

    if ($cartItems->isEmpty()) {
      return response()->json([
        'message' => 'Your cart is empty.',
      ], 400);
    }

    // Validate all items are still purchasable
    $lineItems = [];
    $subtotal = 0;

    foreach ($cartItems as $cartItem) {
      $moc = $cartItem->moc;

      if (!$moc || !$moc->is_public) {
        $mocName = $moc ? $moc->name : 'Unknown';
        return response()->json([
          'message' => "MOC '{$mocName}' is no longer available.",
        ], 400);
      }

      if ($moc->isFree()) {
        return response()->json([
          'message' => "MOC '{$moc->name}' is free and cannot be purchased.",
        ], 400);
      }

      if ($user->ownsMoc($moc)) {
        return response()->json([
          'message' => "You already own '{$moc->name}'.",
        ], 400);
      }

      if ($moc->user_id === $user->id) {
        return response()->json([
          'message' => "You cannot purchase your own MOC '{$moc->name}'.",
        ], 400);
      }

      $price = (float) $moc->price;
      $subtotal += $price;

      $lineItems[] = [
        'price_data' => [
          'currency' => config('stripe.currency', 'usd'),
          'product_data' => [
            'name' => $moc->name,
            'description' => $moc->description ? substr($moc->description, 0, 500) : "LEGO MOC with {$moc->total_parts} parts",
            'images' => $moc->thumbnail ? [url("/storage/{$moc->thumbnail}")] : [],
            'metadata' => [
              'moc_id' => $moc->id,
              'seller_id' => $moc->user_id,
            ],
          ],
          'unit_amount' => (int) ($price * 100), // Convert to cents
        ],
        'quantity' => 1,
      ];
    }

    $platformFee = $subtotal * config('stripe.platform_fee_percentage', 0.05);

    // Create a pending order
    $order = Order::create([
      'user_id' => $user->id,
      'status' => 'pending',
      'subtotal' => $subtotal,
      'platform_fee' => $platformFee,
      'total' => $subtotal,
    ]);

    // Create order items
    foreach ($cartItems as $cartItem) {
      $moc = $cartItem->moc;
      $price = (float) $moc->price;
      $platformAmount = $price * config('stripe.platform_fee_percentage', 0.05);
      $sellerAmount = $price - $platformAmount;

      OrderItem::create([
        'order_id' => $order->id,
        'moc_id' => $moc->id,
        'seller_id' => $moc->user_id,
        'price' => $price,
        'seller_amount' => $sellerAmount,
        'platform_amount' => $platformAmount,
      ]);
    }

    try {
      // Create Stripe Checkout Session
      $session = StripeSession::create([
        'payment_method_types' => ['card'],
        'line_items' => $lineItems,
        'mode' => 'payment',
        'success_url' => url('/checkout/success?session_id={CHECKOUT_SESSION_ID}'),
        'cancel_url' => url('/cart'),
        'customer_email' => $user->email,
        'metadata' => [
          'order_id' => $order->id,
          'user_id' => $user->id,
        ],
        'payment_intent_data' => [
          'metadata' => [
            'order_id' => $order->id,
            'user_id' => $user->id,
          ],
        ],
      ]);

      // Update order with session ID
      $order->update([
        'stripe_checkout_session_id' => $session->id,
      ]);

      return response()->json([
        'checkout_url' => $session->url,
        'session_id' => $session->id,
      ]);
    } catch (\Exception $e) {
      Log::error('Stripe checkout session creation failed', [
        'error' => $e->getMessage(),
        'order_id' => $order->id,
      ]);

      // Delete the pending order
      $order->delete();

      return response()->json([
        'message' => 'Failed to create checkout session. Please try again.',
      ], 500);
    }
  }

  /**
   * Handle successful checkout - verify and complete order.
   */
  public function success(Request $request): JsonResponse
  {
    $sessionId = $request->query('session_id');

    if (!$sessionId) {
      return response()->json([
        'message' => 'Invalid session.',
      ], 400);
    }

    try {
      $session = StripeSession::retrieve($sessionId);

      $order = Order::where('stripe_checkout_session_id', $sessionId)->first();

      if (!$order) {
        return response()->json([
          'message' => 'Order not found.',
        ], 404);
      }

      // Check if already processed
      if ($order->isCompleted()) {
        return response()->json([
          'message' => 'Order already completed.',
          'order_id' => $order->id,
        ]);
      }

      // Verify payment was successful
      if ($session->payment_status === 'paid') {
        $this->completeOrder($order, $session->payment_intent);
      }

      return response()->json([
        'message' => 'Thank you for your purchase!',
        'order_id' => $order->id,
        'status' => $order->status,
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to verify checkout session', [
        'session_id' => $sessionId,
        'error' => $e->getMessage(),
      ]);

      return response()->json([
        'message' => 'Failed to verify payment.',
      ], 500);
    }
  }

  /**
   * Handle Stripe webhook events.
   */
  public function webhook(Request $request): JsonResponse
  {
    $payload = $request->getContent();
    $sigHeader = $request->header('Stripe-Signature');
    $endpointSecret = config('stripe.webhook_secret');

    try {
      $event = Webhook::constructEvent($payload, $sigHeader, $endpointSecret);
    } catch (\UnexpectedValueException $e) {
      Log::error('Stripe webhook invalid payload', ['error' => $e->getMessage()]);
      return response()->json(['error' => 'Invalid payload'], 400);
    } catch (\Stripe\Exception\SignatureVerificationException $e) {
      Log::error('Stripe webhook signature verification failed', ['error' => $e->getMessage()]);
      return response()->json(['error' => 'Invalid signature'], 400);
    }

    Log::info('Stripe webhook received', ['type' => $event->type]);

    switch ($event->type) {
      case 'checkout.session.completed':
        $this->handleCheckoutCompleted($event->data->object);
        break;

      case 'payment_intent.succeeded':
        $this->handlePaymentSucceeded($event->data->object);
        break;

      case 'payment_intent.payment_failed':
        $this->handlePaymentFailed($event->data->object);
        break;

      default:
        Log::info('Unhandled Stripe event type', ['type' => $event->type]);
    }

    return response()->json(['received' => true]);
  }

  /**
   * Handle checkout.session.completed event.
   */
  protected function handleCheckoutCompleted($session): void
  {
    $order = Order::where('stripe_checkout_session_id', $session->id)->first();

    if (!$order || $order->isCompleted()) {
      return;
    }

    if ($session->payment_status === 'paid') {
      $this->completeOrder($order, $session->payment_intent);
    }
  }

  /**
   * Handle payment_intent.succeeded event.
   */
  protected function handlePaymentSucceeded($paymentIntent): void
  {
    $orderId = $paymentIntent->metadata->order_id ?? null;

    if (!$orderId) {
      return;
    }

    $order = Order::find($orderId);

    if (!$order || $order->isCompleted()) {
      return;
    }

    $this->completeOrder($order, $paymentIntent->id);
  }

  /**
   * Handle payment_intent.payment_failed event.
   */
  protected function handlePaymentFailed($paymentIntent): void
  {
    $orderId = $paymentIntent->metadata->order_id ?? null;

    if (!$orderId) {
      return;
    }

    $order = Order::find($orderId);

    if (!$order) {
      return;
    }

    $order->markAsFailed();
  }

  /**
   * Complete an order after successful payment.
   */
  protected function completeOrder(Order $order, string $paymentIntentId): void
  {
    DB::transaction(function () use ($order, $paymentIntentId) {
      // Update order
      $order->update([
        'status' => 'completed',
        'stripe_payment_intent_id' => $paymentIntentId,
      ]);

      // Grant ownership to buyer and create seller earnings
      foreach ($order->items as $item) {
        // Add to user's owned MOCs
        $order->user->ownedMocs()->syncWithoutDetaching([
          $item->moc_id => [
            'type' => 'purchased',
            'price_paid' => $item->price,
          ],
        ]);

        // Create seller earning record
        SellerEarning::create([
          'user_id' => $item->seller_id,
          'order_item_id' => $item->id,
          'amount' => $item->seller_amount,
          'status' => 'pending',
        ]);

        // Notify the seller about the sale
        if ($item->moc) {
          Notification::notifyMocSale($order->user, $item->moc, number_format($item->price, 2));
        }
      }

      // Clear the user's cart
      CartItem::where('user_id', $order->user_id)->delete();

      Log::info('Order completed', [
        'order_id' => $order->id,
        'user_id' => $order->user_id,
        'total' => $order->total,
      ]);
    });
  }

  /**
   * Get user's order history.
   */
  public function orders(Request $request): JsonResponse
  {
    $orders = Order::where('user_id', $request->user()->id)
      ->with(['items.moc:id,set_num,name,price', 'items.moc.images'])
      ->orderBy('created_at', 'desc')
      ->get();

    return response()->json($orders);
  }

  /**
   * Get a specific order.
   */
  public function show(Request $request, string $id): JsonResponse
  {
    $order = Order::where('user_id', $request->user()->id)
      ->with(['items.moc:id,set_num,name,price,description', 'items.moc.images', 'items.seller:id,name'])
      ->findOrFail($id);

    return response()->json($order);
  }
}
