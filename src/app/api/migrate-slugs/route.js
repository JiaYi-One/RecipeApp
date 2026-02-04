import dbConnect from '@/lib/dbConnect';
import { getRecipeModel } from '@/models/Recipe';
import { generateUniqueSlug } from '@/lib/slugify';
import { NextResponse } from 'next/server';

// Run once to add slugs to recipes that don't have them
export async function POST() {
  try {
    await dbConnect();
    const Recipe = getRecipeModel();

    // Find recipes without slugs
    const recipesWithoutSlugs = await Recipe.find({ 
      $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] 
    });

    if (recipesWithoutSlugs.length === 0) {
      return NextResponse.json({ 
        message: 'All recipes already have slugs',
        updated: 0 
      }, { status: 200 });
    }

    let updated = 0;
    for (const recipe of recipesWithoutSlugs) {
      recipe.slug = await generateUniqueSlug(Recipe, recipe.title, recipe.userId, recipe._id);
      await recipe.save();
      updated++;
    }

    return NextResponse.json({ 
      message: `Successfully added slugs to ${updated} recipes`,
      updated 
    }, { status: 200 });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      message: 'Migration failed', 
      error: error.message 
    }, { status: 500 });
  }
}
