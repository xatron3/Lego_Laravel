<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\Customer;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Subscription;
use Stripe\Webhook;

class ProSubscriptionController extends Controller
{
  /**
   * Monthly price in cents ($3.99).
   */
  private const PRICE_CENTS = 399;
  private const PRICE_DISPLAY = '$3.99';

  public function __construct()
  {
    Stripe::setApiKey(config('stripe.secret'));
  }

  /**
   * Get the current user's subscription status.
   */
  public function status(Request $request): JsonResponse
  {
    $user = $request->user();

    return response()->json([
      'is_pro' => $user->isPro(),
      'pro_expires_at' => $user->pro_expires_at?->toISOString(),
      'has_subscription' => !is_null($user->stripe_subscription_id),
      'price' => self::PRICE_DISPLAY,
    ]);
  }

  /**
   * Create a Stripe Checkout session for Pro subscription.
   */
  public function subscribe(Request $request): JsonResponse
  {
    $user = $request->user();

    if ($user->isPro()) {
      return response()->json(['message' => 'You already have an active Pro subscription.'], 422);
    }

    try {
      // Get or create Stripe customer
      $customerId = $this->getOrCreateStripeCustomer($user);

      // Create a Stripe Checkout Session for subscription
      $session = StripeSession::create([
        'customer' => $customerId,
        'payment_method_types' => ['card'],
        'mode' => 'subscription',
        'line_items' => [[
          'price_data' => [
            'currency' => config('stripe.currency', 'usd'),
            'product_data' => [
              'name' => 'BrickOasis Pro',
              'description' => 'Monthly Pro subscription - Unlimited flips, 3D viewer access, and MOC promotion',
            ],
            'unit_amount' => self::PRICE_CENTS,
            'recurring' => [
              'interval' => 'month',
            ],
          ],
          'quantity' => 1,
        ]],
        'success_url' => url('/dashboard/settings?pro=success'),
        'cancel_url' => url('/pro?cancelled=true'),
        'metadata' => [
          'user_id' => $user->id,
          'type' => 'pro_subscription',
        ],
      ]);

      return response()->json([
        'checkout_url' => $session->url,
        'session_id' => $session->id,
      ]);
    } catch (\Exception $e) {
      Log::error('Pro subscription checkout failed', [
        'user_id' => $user->id,
        'error' => $e->getMessage(),
      ]);

      return response()->json([
        'message' => 'Failed to create subscription checkout. Please try again.',
      ], 500);
    }
  }

  /**
   * Cancel the user's Pro subscription.
   */
  public function cancel(Request $request): JsonResponse
  {
    $user = $request->user();

    if (!$user->stripe_subscription_id) {
      return response()->json(['message' => 'No active subscription found.'], 422);
    }

    try {
      // Cancel at period end (user keeps access until current period ends)
      $subscription = Subscription::retrieve($user->stripe_subscription_id);
      $subscription->cancel_at_period_end = true;
      $subscription->save();

      Log::info('Pro subscription cancellation scheduled', [
        'user_id' => $user->id,
        'subscription_id' => $user->stripe_subscription_id,
        'current_period_end' => $subscription->current_period_end,
      ]);

      return response()->json([
        'message' => 'Your Pro subscription will be cancelled at the end of the current billing period.',
        'pro_expires_at' => date('c', $subscription->current_period_end),
      ]);
    } catch (\Exception $e) {
      Log::error('Pro subscription cancellation failed', [
        'user_id' => $user->id,
        'error' => $e->getMessage(),
      ]);

      return response()->json([
        'message' => 'Failed to cancel subscription. Please try again.',
      ], 500);
    }
  }

  /**
   * Resume a cancelled subscription (if still within the current period).
   */
  public function resume(Request $request): JsonResponse
  {
    $user = $request->user();

    if (!$user->stripe_subscription_id) {
      return response()->json(['message' => 'No subscription found.'], 422);
    }

    try {
      $subscription = Subscription::retrieve($user->stripe_subscription_id);

      if ($subscription->status === 'active' && $subscription->cancel_at_period_end) {
        $subscription->cancel_at_period_end = false;
        $subscription->save();

        $user->update(['pro_expires_at' => null]);

        return response()->json([
          'message' => 'Your Pro subscription has been resumed.',
        ]);
      }

      return response()->json(['message' => 'Subscription cannot be resumed.'], 422);
    } catch (\Exception $e) {
      Log::error('Pro subscription resume failed', [
        'user_id' => $user->id,
        'error' => $e->getMessage(),
      ]);

      return response()->json([
        'message' => 'Failed to resume subscription. Please try again.',
      ], 500);
    }
  }

  /**
   * Handle Stripe webhook events for subscriptions.
   */
  public function webhook(Request $request): JsonResponse
  {
    $payload = $request->getContent();
    $sigHeader = $request->header('Stripe-Signature');
    $endpointSecret = config('stripe.webhook_secret');

    try {
      $event = Webhook::constructEvent($payload, $sigHeader, $endpointSecret);
    } catch (\UnexpectedValueException $e) {
      Log::error('Pro webhook invalid payload', ['error' => $e->getMessage()]);
      return response()->json(['error' => 'Invalid payload'], 400);
    } catch (\Stripe\Exception\SignatureVerificationException $e) {
      Log::error('Pro webhook signature verification failed', ['error' => $e->getMessage()]);
      return response()->json(['error' => 'Invalid signature'], 400);
    }

    Log::info('Pro webhook received', ['type' => $event->type]);

    switch ($event->type) {
      case 'checkout.session.completed':
        $this->handleCheckoutCompleted($event->data->object);
        break;

      case 'customer.subscription.updated':
        $this->handleSubscriptionUpdated($event->data->object);
        break;

      case 'customer.subscription.deleted':
        $this->handleSubscriptionDeleted($event->data->object);
        break;

      case 'invoice.payment_succeeded':
        $this->handleInvoicePaymentSucceeded($event->data->object);
        break;

      case 'invoice.payment_failed':
        $this->handleInvoicePaymentFailed($event->data->object);
        break;
    }

    return response()->json(['received' => true]);
  }

  // ==================== Webhook Handlers ====================

  protected function handleCheckoutCompleted($session): void
  {
    $type = $session->metadata->type ?? null;
    if ($type !== 'pro_subscription') {
      return;
    }

    $userId = $session->metadata->user_id ?? null;
    if (!$userId) {
      return;
    }

    $user = User::find($userId);
    if (!$user) {
      return;
    }

    // Get the subscription from the session
    $subscriptionId = $session->subscription;
    if ($subscriptionId) {
      $subscription = Subscription::retrieve($subscriptionId);

      $user->update([
        'is_pro' => true,
        'pro_expires_at' => null,
        'stripe_customer_id' => $session->customer,
        'stripe_subscription_id' => $subscriptionId,
      ]);

      Log::info('Pro subscription activated via checkout', [
        'user_id' => $user->id,
        'subscription_id' => $subscriptionId,
      ]);
    }
  }

  protected function handleSubscriptionUpdated($subscription): void
  {
    $user = User::where('stripe_subscription_id', $subscription->id)->first();
    if (!$user) {
      return;
    }

    if ($subscription->status === 'active') {
      $user->update([
        'is_pro' => true,
        'pro_expires_at' => $subscription->cancel_at_period_end
          ? \Carbon\Carbon::createFromTimestamp($subscription->current_period_end)
          : null,
      ]);
    } elseif (in_array($subscription->status, ['past_due', 'unpaid'])) {
      // Keep pro active but log the issue
      Log::warning('Pro subscription payment issue', [
        'user_id' => $user->id,
        'status' => $subscription->status,
      ]);
    }
  }

  protected function handleSubscriptionDeleted($subscription): void
  {
    $user = User::where('stripe_subscription_id', $subscription->id)->first();
    if (!$user) {
      return;
    }

    $user->update([
      'is_pro' => false,
      'pro_expires_at' => null,
      'stripe_subscription_id' => null,
    ]);

    Log::info('Pro subscription ended', ['user_id' => $user->id]);
  }

  protected function handleInvoicePaymentSucceeded($invoice): void
  {
    $subscriptionId = $invoice->subscription;
    if (!$subscriptionId) {
      return;
    }

    $user = User::where('stripe_subscription_id', $subscriptionId)->first();
    if (!$user) {
      return;
    }

    // Renew pro status
    $user->update([
      'is_pro' => true,
      'pro_expires_at' => null,
    ]);

    Log::info('Pro subscription renewed', ['user_id' => $user->id]);
  }

  protected function handleInvoicePaymentFailed($invoice): void
  {
    $subscriptionId = $invoice->subscription;
    if (!$subscriptionId) {
      return;
    }

    $user = User::where('stripe_subscription_id', $subscriptionId)->first();
    if (!$user) {
      return;
    }

    Log::warning('Pro subscription payment failed', [
      'user_id' => $user->id,
      'invoice_id' => $invoice->id,
    ]);
  }

  // ==================== Helpers ====================

  protected function getOrCreateStripeCustomer(User $user): string
  {
    if ($user->stripe_customer_id) {
      return $user->stripe_customer_id;
    }

    $customer = Customer::create([
      'email' => $user->email,
      'name' => $user->name,
      'metadata' => [
        'user_id' => $user->id,
      ],
    ]);

    $user->update(['stripe_customer_id' => $customer->id]);

    return $customer->id;
  }
}
