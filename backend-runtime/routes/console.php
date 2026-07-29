<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/** Rappels RDV : J-1 (quotidien) + H-2 (toutes les 15 min). */
Schedule::command('rdv:envoyer-rappels')->everyFifteenMinutes();
