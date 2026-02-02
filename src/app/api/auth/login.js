import dbConnect from '@/lib/dbConnect';
import {getUserModel} from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await dbConnect();
    const { email, password } = await req.json();
    const User = getUserModel();
    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // 2. Use bcrypt to compare the plain-text password with the hash in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // 3. Create the JWT (The "Membership Card")
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return NextResponse.json({ 
      message: 'Login successful', 
      token,
      user: { name: user.name, email: user.email } 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Login failed', error: error.message }, { status: 500 });
  }
}