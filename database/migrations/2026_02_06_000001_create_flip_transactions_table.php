<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Main flip transactions table
        Schema::create('flip_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['buy', 'sell']);
            $table->string('title');
            $table->decimal('price', 10, 2);
            $table->text('notes')->nullable();
            $table->string('platform')->nullable(); // eBay, BrickLink, Facebook, etc.
            $table->date('transaction_date');
            $table->decimal('shipping_cost', 10, 2)->default(0);
            $table->decimal('fees', 10, 2)->default(0); // platform fees, taxes, etc.
            $table->enum('status', ['open', 'partial', 'complete'])->default('open');
            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'transaction_date']);
        });

        // Items within a transaction (sets, minifigs, or custom items)
        Schema::create('flip_transaction_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flip_transaction_id')->constrained()->onDelete('cascade');
            $table->enum('item_type', ['set', 'minifig', 'custom']);
            $table->string('set_num')->nullable(); // FK to sets table
            $table->string('fig_num')->nullable(); // FK to minifigs table
            $table->string('custom_description')->nullable(); // e.g. "10kg random lego"
            $table->integer('quantity')->default(1);
            $table->decimal('estimated_value', 10, 2)->nullable(); // per-item estimated value
            $table->string('condition')->nullable(); // new, used, sealed
            $table->timestamps();

            $table->index('flip_transaction_id');
            $table->index(['item_type', 'set_num']);
            $table->index(['item_type', 'fig_num']);
        });

        // Matches between buy and sell transactions
        Schema::create('flip_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('buy_transaction_id')->constrained('flip_transactions')->onDelete('cascade');
            $table->foreignId('sell_transaction_id')->constrained('flip_transactions')->onDelete('cascade');
            $table->decimal('buy_amount', 10, 2); // portion of buy price attributed
            $table->decimal('sell_amount', 10, 2); // portion of sell price attributed
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('buy_transaction_id');
            $table->index('sell_transaction_id');
        });

        // Match-level item linking (which specific items in the buy match to the sell)
        Schema::create('flip_match_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flip_match_id')->constrained()->onDelete('cascade');
            $table->foreignId('flip_transaction_item_id')->constrained()->onDelete('cascade');
            $table->integer('quantity')->default(1); // how many of this item are part of this match
            $table->timestamps();

            $table->index('flip_match_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flip_match_items');
        Schema::dropIfExists('flip_matches');
        Schema::dropIfExists('flip_transaction_items');
        Schema::dropIfExists('flip_transactions');
    }
};
