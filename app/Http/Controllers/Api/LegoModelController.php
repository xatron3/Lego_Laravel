<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LegoModel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LegoModelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $models = LegoModel::latest()->get(['id', 'name', 'description', 'file_name', 'total_steps', 'total_parts', 'created_at']);

        return response()->json($models);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'ldr_content' => 'required|string',
            'file_name' => 'nullable|string|max:255',
            'total_steps' => 'integer|min:0',
            'total_parts' => 'integer|min:0',
        ]);

        $model = LegoModel::create($validated);

        return response()->json($model, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(LegoModel $legoModel): JsonResponse
    {
        return response()->json($legoModel);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, LegoModel $legoModel): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'ldr_content' => 'sometimes|required|string',
            'file_name' => 'nullable|string|max:255',
            'total_steps' => 'integer|min:0',
            'total_parts' => 'integer|min:0',
        ]);

        $legoModel->update($validated);

        return response()->json($legoModel);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(LegoModel $legoModel): JsonResponse
    {
        $legoModel->delete();

        return response()->json(null, 204);
    }
}
