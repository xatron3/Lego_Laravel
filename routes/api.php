<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\LegoModelController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// LEGO Models API routes (public for now, can add auth later)
Route::apiResource('lego-models', LegoModelController::class);
