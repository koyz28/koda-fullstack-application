<?php

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('client_name');
            $table->string('project_name');
            $table->text('description')->nullable();
            // Stored as strings (not DB enums) so new values only require an application change.
            $table->string('status', 20)->default(ProjectStatus::Planning->value);
            $table->string('priority', 20)->default(ProjectPriority::Medium->value);
            $table->date('start_date');
            $table->date('due_date')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'priority']);
            $table->index(['user_id', 'due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
