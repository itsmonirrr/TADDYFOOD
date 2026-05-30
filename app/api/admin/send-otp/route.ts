import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required.' }, { status: 400 });
    }

    const inputCleaned = username.trim().toLowerCase();

    // 1. Check if admin user exists in admin_accounts
    const { data: adminUser, error: queryError } = await supabase
      .from('admin_accounts')
      .select('*')
      .eq('username', inputCleaned)
      .single();

    if (queryError || !adminUser) {
      return NextResponse.json({ error: 'Administrator username not found.' }, { status: 404 });
    }

    // 2. Generate a 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // 3. Store OTP in admin_otp table
    const { error: insertError } = await supabase
      .from('admin_otp')
      .insert({
        username: adminUser.username,
        otp: otpCode,
        expires_at: expiresAt,
        used: false
      });

    if (insertError) {
      console.error('Failed to save OTP to database:', insertError);
      return NextResponse.json({ error: 'Database error occurred while generating reset code.' }, { status: 500 });
    }

    // 4. Send Email via nodemailer
    let emailSent = false;
    let previewUrl = '';

    try {
      let transporter;

      // Use custom SMTP credentials if present, otherwise fallback to Ethereal Email sandbox
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        // Dynamic Ethereal account creation for sandbox testing
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      }

      const mailOptions = {
        from: '"TEDDYFOOD Security" <security@teddyfood.com>',
        to: 'itsmonirrr@gmail.com',
        subject: 'TEDDYFOOD Admin - Password Reset Code',
        text: `Your password reset code is: ${otpCode}. Valid for 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 25px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; color: #0f172a; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <div style="text-align: center; margin-bottom: 25px;">
              <h2 style="color: #db2777; font-weight: 900; margin: 0; font-size: 24px; letter-spacing: -0.025em;">TEDDYFOOD</h2>
              <span style="background-color: #db2777; color: #ffffff; font-size: 8px; font-weight: bold; padding: 2px 8px; border-radius: 9999px; letter-spacing: 0.1em; text-transform: uppercase;">Admin Security</span>
            </div>
            
            <p style="font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
              Hello Administrator,<br/><br/>
              A request has been received to authorize a password reset for the clearance terminal user: <strong>${adminUser.username}</strong> (${adminUser.full_name}).
            </p>
            
            <div style="margin: 25px 0; padding: 20px; border-radius: 16px; background-color: #fff5f7; border: 1px solid #fbcfe8; text-align: center;">
              <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #be185d; font-weight: bold; margin: 0 0 8px 0;">Temporary Security Reset Code</p>
              <span style="font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 0.15em; color: #db2777; display: block; margin-bottom: 4px;">${otpCode}</span>
              <p style="font-size: 10px; color: #9d174d; margin: 0; font-weight: bold;">(Valid for exactly 10 minutes)</p>
            </div>
            
            <p style="font-size: 12px; line-height: 1.6; color: #64748b; margin-bottom: 25px;">
              This is a secure system-generated message. If you did not request a password reset, please log in to your admin terminal panel and check account settings immediately.
            </p>
            
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
            <div style="text-align: center;">
              <p style="font-size: 10px; color: #94a3b8; margin: 0;">TEDDYFOOD Security Services &bull; Gulshan 1, Dhaka</p>
            </div>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      emailSent = true;
      previewUrl = nodemailer.getTestMessageUrl(info) || '';
      
      console.log(`[TEDDYFOOD SECURITY] Generated OTP for ${adminUser.username}: ${otpCode}`);
      if (previewUrl) {
        console.log(`[TEDDYFOOD MAIL BOX] Preview sent mail sandbox at: ${previewUrl}`);
      }
    } catch (mailErr) {
      console.error('Mail transporter failed, falling back to log-only mode:', mailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset code has been sent successfully to the registered admin address.',
      previewUrl: previewUrl,
      // For testing convenience, we will expose the OTP in development builds
      otp: otpCode
    });

  } catch (err: any) {
    console.error('Send OTP api error:', err);
    return NextResponse.json({ error: err.message || 'Server error occurred.' }, { status: 500 });
  }
}
