import dbConnect from '@/lib/dbConnect';
import { getRecipeModel } from '@/models/Recipe';
import { getUserModel } from '@/models/User';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

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

    // Support slug (e.g. matcha-choux-filling-1234) or legacy ObjectId
    const isObjectId = /^[a-f\d]{24}$/i.test(slugOrId);
    const query = isObjectId
      ? { _id: slugOrId, userId: decoded.userId }
      : { slug: slugOrId, userId: decoded.userId };

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
