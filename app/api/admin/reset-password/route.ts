import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { username, otp, newPassword } = await request.json();

    if (!username || !otp) {
      return NextResponse.json({ error: 'Username and reset code are required.' }, { status: 400 });
    }

    const inputCleaned = username.trim().toLowerCase();
    const otpCleaned = otp.trim();

    // 1. Query the latest active OTP code for this username
    const { data: otpRecords, error: otpQueryError } = await supabase
      .from('admin_otp')
      .select('*')
      .eq('username', inputCleaned)
      .eq('otp', otpCleaned)
      .eq('used', false)
      .order('created_at', { ascending: false });

    if (otpQueryError || !otpRecords || otpRecords.length === 0) {
      return NextResponse.json({ error: 'Invalid reset code. Please check and try again.' }, { status: 400 });
    }

    const latestOtp = otpRecords[0];

    // 2. Check if the OTP is expired (expires_at is smaller than now)
    const isExpired = new Date() > new Date(latestOtp.expires_at);
    if (isExpired) {
      return NextResponse.json({ error: 'This reset code has expired (valid for 10 minutes). Please request a new code.' }, { status: 400 });
    }

    // 3. If newPassword is provided, perform password reset
    if (newPassword !== undefined) {
      const passCleaned = newPassword.trim();

      if (passCleaned.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
      }
      if (passCleaned.length > 8) {
        return NextResponse.json({ error: 'Password cannot exceed 8 characters in length.' }, { status: 400 });
      }

      // a. Update admin password in admin_accounts table
      const { error: updateError } = await supabase
        .from('admin_accounts')
        .update({ password: passCleaned })
        .eq('username', inputCleaned);

      if (updateError) {
        console.error('Failed to update admin password in database:', updateError);
        return NextResponse.json({ error: 'Failed to update administrative credentials.' }, { status: 500 });
      }

      // b. Mark OTP code as used
      const { error: otpUpdateError } = await supabase
        .from('admin_otp')
        .update({ used: true })
        .eq('id', latestOtp.id);

      if (otpUpdateError) {
        console.error('Failed to update OTP used status:', otpUpdateError);
      }

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully!'
      });
    }

    // 4. Verification-only check (Step 3: transition to step 4)
    return NextResponse.json({
      success: true,
      message: 'Reset code successfully verified. You may proceed.'
    });

  } catch (err: any) {
    console.error('Reset Password api error:', err);
    return NextResponse.json({ error: err.message || 'Server error occurred.' }, { status: 500 });
  }
}
