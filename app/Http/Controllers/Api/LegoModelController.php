<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LegoModel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class LegoModelController extends Controller
{
    /**
     * Display a listing of public models.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $models = LegoModel::visibleTo($user)
            ->with('user:id,name')
            ->latest()
            ->get(['id', 'name', 'description', 'file_name', 'total_steps', 'total_parts', 'user_id', 'is_public', 'price', 'thumbnail', 'created_at']);

        return response()->json($models);
    }

    /**
     * Get models owned by the authenticated user.
     */
    public function myModels(Request $request): JsonResponse
    {
        $models = $request->user()
            ->legoModels()
            ->latest()
            ->get(['id', 'name', 'description', 'file_name', 'total_steps', 'total_parts', 'is_public', 'price', 'thumbnail', 'created_at']);

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
            'is_public' => 'boolean',
            'price' => 'nullable|numeric|min:0',
        ]);

        // Associate with authenticated user if logged in
        if ($request->user()) {
            $validated['user_id'] = $request->user()->id;
        }

        // Set default visibility
        if (!isset($validated['is_public'])) {
            $validated['is_public'] = false;
        }

        $model = LegoModel::create($validated);

        return response()->json($model->load('user:id,name'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $legoModel = LegoModel::findOrFail($id);

        // Check if user can access this model
        if (!$legoModel->canBeAccessedBy($request->user())) {
            return response()->json(['message' => 'Model not found or access denied.'], 404);
        }

        $model = $legoModel->load('user:id,name');

        // If user doesn't have content access, remove LDR content from response
        if (!$legoModel->canAccessContent($request->user())) {
            $model->makeHidden('ldr_content');
        }

        return response()->json($model);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, LegoModel $legoModel): JsonResponse
    {
        // Check ownership or admin status
        $user = $request->user();
        if (!$user || ($legoModel->user_id !== $user->id && !$user->canModerate())) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'ldr_content' => 'sometimes|required|string',
            'file_name' => 'nullable|string|max:255',
            'total_steps' => 'integer|min:0',
            'total_parts' => 'integer|min:0',
            'is_public' => 'boolean',
            'price' => 'nullable|numeric|min:0',
        ]);

        $legoModel->update($validated);

        return response()->json($legoModel->fresh()->load('user:id,name'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, LegoModel $legoModel): JsonResponse
    {
        // Check ownership or admin status
        $user = $request->user();
        if (!$user || ($legoModel->user_id !== $user->id && !$user->canModerate())) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $legoModel->delete();

        return response()->json(null, 204);
    }

    /**
     * Check if the authenticated user owns a specific model.
     */
    public function checkOwnership(Request $request, LegoModel $legoModel): JsonResponse
    {
        $user = $request->user();

        // Creator always owns the model
        if ($legoModel->user_id === $user->id) {
            return response()->json([
                'owns' => true,
                'type' => 'created',
            ]);
        }

        // Check if user has claimed/purchased
        $ownership = $user->ownedModels()->where('lego_model_id', $legoModel->id)->first();

        if ($ownership) {
            return response()->json([
                'owns' => true,
                'type' => $ownership->pivot->type,
            ]);
        }

        return response()->json([
            'owns' => false,
            'type' => null,
        ]);
    }

    /**
     * Claim a free model for the authenticated user.
     */
    public function claim(Request $request, LegoModel $legoModel): JsonResponse
    {
        $user = $request->user();

        // Check if model is public and free
        if (!$legoModel->is_public) {
            return response()->json(['message' => 'This model is not available for claiming.'], 403);
        }

        if (!$legoModel->isFree()) {
            return response()->json(['message' => 'This model is not free. Please purchase it.'], 403);
        }

        // Check if user already owns it
        if ($user->ownsModel($legoModel)) {
            return response()->json(['message' => 'You already own this model.'], 400);
        }

        // Add to user's owned models
        $user->ownedModels()->attach($legoModel->id, [
            'type' => 'claimed',
            'price_paid' => null,
        ]);

        return response()->json([
            'message' => 'Model added to your library successfully.',
            'owns' => true,
            'type' => 'claimed',
        ]);
    }
}
