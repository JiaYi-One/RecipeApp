// import dbConnect from '@/lib/dbConnect';
// import { NextResponse } from 'next/server';

// export async function GET() {
//   try {
//     await dbConnect();
//     return NextResponse.json({ message: "Connected to MongoDB successfully!" });
//   } catch (e) {
//     console.error('[api-test] DB connection error:', e.message);
//     return NextResponse.json({ error: e.message }, { status: 500 });
//   }
// }
import dbConnect from '@/lib/dbConnect';
import Recipe from '@/models/Recipe';
import { NextResponse } from 'next/server';

export async function GET() {
  await dbConnect(); // Opens the bridge
  try {
    const recipes = await Recipe.find({}); // Fetches data using the model
    return NextResponse.json({ success: true, data: recipes });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}