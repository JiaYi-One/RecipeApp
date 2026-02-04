import dbConnect from '@/lib/dbConnect';
import { getRecipeModel } from '@/models/Recipe';
import { getUserModel } from '@/models/User';
import { generateUniqueSlug } from '@/lib/slugify';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// Helper to build a query that supports either slug or legacy ObjectId
function buildRecipeQuery(slugOrId, userId) {
  const isObjectId = /^[a-f\d]{24}$/i.test(slugOrId);
  return isObjectId
    ? { _id: slugOrId, userId }
    : { slug: slugOrId, userId };
}

// GET: Fetch a single recipe by slug (or by _id for old links)
export async function GET(req, { params }) {
  try {
    await dbConnect();
    getUserModel(); // register User so Recipe.populate('userId') can resolve ref
    const Recipe = getRecipeModel();

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { slug: slugOrId } = await params;

    const query = buildRecipeQuery(slugOrId, decoded.userId);

    const recipe = await Recipe.findOne(query)
      .populate('userId', 'name');

    if (!recipe) {
      return NextResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json(recipe, { status: 200 });
  } catch (error) {
    console.error('GET /api/recipe/[slug] error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ message: 'Token expired or invalid' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Failed to fetch recipe' }, { status: 500 });
  }
}

// PUT: Update an existing recipe (title/category/ingredients/instructions)
export async function PUT(req, { params }) {
  try {
    await dbConnect();
    getUserModel();
    const Recipe = getRecipeModel();

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { slug: slugOrId } = await params;

    const { title, category, ingredients, instructions } = await req.json();

    if (!title || !category || !Array.isArray(ingredients) || ingredients.length === 0 || !instructions) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const query = buildRecipeQuery(slugOrId, decoded.userId);
    const recipe = await Recipe.findOne(query);

    if (!recipe) {
      return NextResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }

    // If title changes, generate a new unique slug for this user
    let newSlug = recipe.slug;
    if (title !== recipe.title) {
      newSlug = await generateUniqueSlug(Recipe, title, decoded.userId, recipe._id);
    }

    recipe.title = title;
    recipe.category = category;
    recipe.ingredients = ingredients;
    recipe.instructions = instructions;
    recipe.slug = newSlug;

    await recipe.save();

    const populated = await recipe.populate('userId', 'name');

    return NextResponse.json(populated, { status: 200 });
  } catch (error) {
    console.error('PUT /api/recipe/[slug] error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ message: 'Token expired or invalid' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Failed to update recipe' }, { status: 500 });
  }
}

// DELETE: Remove a recipe owned by the current user
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const Recipe = getRecipeModel();

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { slug: slugOrId } = await params;

    const query = buildRecipeQuery(slugOrId, decoded.userId);
    const deleted = await Recipe.findOneAndDelete(query);

    if (!deleted) {
      return NextResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Recipe deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/recipe/[slug] error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ message: 'Token expired or invalid' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Failed to delete recipe' }, { status: 500 });
  }
}
