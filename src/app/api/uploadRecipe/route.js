import dbConnect from '@/lib/dbConnect';
import { getRecipeModel } from '@/models/Recipe';
import { getUserModel } from '@/models/User';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// 1. GET: Fetch recipes for logged-in user
export async function GET(req) {
  try {
    await dbConnect();
    getUserModel(); // register User so Recipe.populate('userId') can resolve ref
    const Recipe = getRecipeModel();
    
    // Check if user is logged in
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json([], { status: 200 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Only fetch recipes from the logged-in user
    const recipes = await Recipe.find({ userId: decoded.userId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(recipes, { status: 200 });
  } catch (error) {
    console.error('GET /api/uploadRecipe error:', error);
    // JWT invalid or expired → tell frontend to re-login
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ message: 'Token expired or invalid' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Failed to fetch recipes' }, { status: 500 });
  }
}

// 2. POST: Upload a new recipe (Protected Route)
export async function POST(req) {
  try {
    await dbConnect();

    // Verify User via JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { title, category, ingredients, instructions } = await req.json();

    // Create URL-friendly slug; timestamp suffix ensures uniqueness (e.g. two "Egg Tart" → egg-tart-1234, egg-tart-5678)
    const createSlug = (text) => {
      return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
    };
    const slug = `${createSlug(title)}-${Date.now().toString().slice(-4)}`;

    const Recipe = getRecipeModel();
    const newRecipe = await Recipe.create({
      title,
      slug,
      category,
      ingredients,
      instructions,
      userId: decoded.userId,
    });

    return NextResponse.json(newRecipe, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}