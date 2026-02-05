import dbConnect from '@/lib/dbConnect';
import { getRecipeModel } from '@/models/Recipe';
import { getUserModel } from '@/models/User';
import { generateUniqueSlug } from '@/lib/slugify';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    await dbConnect();
    getUserModel();
    const Recipe = getRecipeModel();
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json([], { status: 200 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const recipes = await Recipe.find({ userId: decoded.userId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(recipes, { status: 200 });
  } catch (error) {
    console.error('GET /api/uploadRecipe error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ message: 'Token expired or invalid' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Failed to fetch recipes' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();

    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { title, category, ingredients, instructions } = await req.json();
    const Recipe = getRecipeModel();
    
    const slug = await generateUniqueSlug(Recipe, title, decoded.userId);

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