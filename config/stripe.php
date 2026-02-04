<?php

return [
  /*
    |--------------------------------------------------------------------------
    | Stripe API Keys
    |--------------------------------------------------------------------------
    |
    | Your Stripe API keys. The secret key should be kept private and never
    | exposed in client-side code.
    |
    */

  'secret' => env('STRIPE_SECRET'),
  'publishable' => env('STRIPE_PUBLISHABLE'),
  'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),

  /*
    |--------------------------------------------------------------------------
    | Platform Fee
    |--------------------------------------------------------------------------
    |
    | The percentage the platform takes from each sale (as decimal).
    | 0.05 = 5%
    |
    */

  'platform_fee_percentage' => env('STRIPE_PLATFORM_FEE', 0.05),

  /*
    |--------------------------------------------------------------------------
    | Currency
    |--------------------------------------------------------------------------
    |
    | The currency to use for transactions.
    |
    */

  'currency' => env('STRIPE_CURRENCY', 'usd'),
];
