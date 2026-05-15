<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('screenplay_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('screenplay_id')->constrained()->cascadeOnDelete();
            $table->integer('version');
            $table->json('blocks')->default('[]');
            $table->string('label')->nullable();
            $table->timestamps();

            $table->index(['screenplay_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('screenplay_versions');
    }
};
