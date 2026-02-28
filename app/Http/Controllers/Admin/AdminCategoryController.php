<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Category::withCount('documents')->orderBy('order')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'  => 'required|string|max:100|unique:categories',
            'color' => 'nullable|string|max:7',
            'order' => 'nullable|integer',
        ]);

        $cat = Category::create($request->only('name', 'description', 'color', 'order'));
        return response()->json($cat, 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $request->validate([
            'name'  => 'required|string|max:100|unique:categories,name,' . $category->id,
            'color' => 'nullable|string|max:7',
        ]);

        $category->update($request->only('name', 'description', 'color', 'order', 'is_active'));
        return response()->json($category);
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();
        return response()->json(['message' => 'Catégorie supprimée.']);
    }
}
