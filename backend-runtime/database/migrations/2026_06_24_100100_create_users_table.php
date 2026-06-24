<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 100);
            $table->string('email', 150)->unique();
            $table->string('phone', 25)->nullable();
            $table->string('password');
            $table->enum('role', [
                'patient', 'medecin_generaliste', 'medecin_interne', 'pediatre', 'gynecologue',
                'sage_femme', 'chirurgien', 'anesthesiste', 'ophtalmologue', 'laborantin',
                'echographiste', 'kinesitherapeute', 'dentiste', 'pharmacien', 'infirmier',
                'urgentiste', 'caissier', 'receptionniste', 'admin',
            ]);
            $table->foreignId('departement_id')->nullable()->constrained('departements');
            $table->string('avatar')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('fcm_token')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
