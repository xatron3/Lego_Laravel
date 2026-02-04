<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sets', function (Blueprint $table) {
            // MOC-specific fields
            $table->boolean('is_moc')->default(false)->after('num_parts');
            $table->longText('ldr_content')->nullable()->after('is_moc');
            $table->text('description')->nullable()->after('name');
            $table->string('file_name')->nullable()->after('ldr_content');
            $table->decimal('price', 10, 2)->nullable()->after('file_name');
            $table->boolean('is_public')->default(true)->after('price');
            $table->string('thumbnail')->nullable()->after('is_public');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade')->after('thumbnail');

            // Add indexes
            $table->index('is_moc');
            $table->index('user_id');
            $table->index('is_public');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sets', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropIndex(['is_moc']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['is_public']);
            $table->dropColumn([
                'is_moc',
                'ldr_content',
                'description',
                'file_name',
                'price',
                'is_public',
                'thumbnail',
                'user_id',
            ]);
        });
    }
};
