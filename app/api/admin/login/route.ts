import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from('admin_accounts')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();

    // Return detailed error for debugging
    if (error) {
      console.error('Admin API Login Error:', error);
      return NextResponse.json({ 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ 
        error: 'No matching account found.',
        searched: { username, password }
      }, { status: 401 });
    }

    return NextResponse.json({ admin: data });

  } catch (err: any) {
    console.error('Admin API Catch Error:', err);
    return NextResponse.json({ error: err.message || 'Server error occurred.' }, { status: 500 });
  }
}
