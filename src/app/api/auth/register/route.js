import dbConnect from '@/lib/dbConnect';
import { getUserModel } from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await dbConnect();
    const { name, email, password } = await req.json();

    const User = getUserModel();
    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return NextResponse.json({ 
      message: 'User registered successfully', 
      userId: newUser._id 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ 
      message: 'Registration failed', 
      error: error.message 
    }, { status: 500 });
  }
}
