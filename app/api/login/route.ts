// @ts-ignore
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { serialize } from 'cookie';

const BACKEND_URL = 'http://localhost:3333/auth/login';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const response = await axios.post(BACKEND_URL, {
      email,
      password,
    });

    const { accessToken } = response.data;

    if (!accessToken) {
      return NextResponse.json(
        { message: 'Access token not found in response' },
        { status: 500 },
      );
    }

    const cookie = serialize('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 1 tuần
      path: '/',
      sameSite: 'lax',
    });

    return new Response(JSON.stringify({ message: 'Login successful' }), {
      status: 200,
      headers: { 'Set-Cookie': cookie },
    });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message || 'An unexpected error occurred.';
    return NextResponse.json({ message }, { status });
  }
}
