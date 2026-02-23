const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (toEmail, otp, purpose = 'verification') => {
  const isLogin    = purpose === 'login';
  const subject    = isLogin ? 'Your Login OTP - Wedding Memories' : 'Verify Your Email - Wedding Memories';
  const actionText = isLogin ? 'login to' : 'create your account on';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
        body { font-family: 'Georgia', serif; background: #FFF0F5; margin: 0; padding: 20px; }
        .card { max-width: 480px; margin: 0 auto; background: white;
                border-radius: 24px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.12); }
        .header { background: linear-gradient(135deg,#E8C87A,#C9A961);
                  padding: 32px; text-align: center; }
        .header h1 { color: white; font-size: 26px; margin: 0; letter-spacing: 1px; }
        .header p  { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
        .body { padding: 36px 32px; text-align: center; }
        .body p { color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px; }
        .otp-box { display: inline-block; background: linear-gradient(135deg,#FFF0F5,#FFE4E1);
                   border: 2px solid #E8C87A; border-radius: 16px;
                   padding: 20px 40px; margin: 8px 0 24px; }
        .otp { font-family: 'Courier New', monospace; font-size: 40px;
               font-weight: bold; color: #C9A961; letter-spacing: 10px; }
        .expire { background: #FFF8E1; border-radius: 10px; padding: 12px 20px;
                  color: #B8860B; font-size: 13px; margin: 0 0 20px; }
        .footer { background: #FFF0F5; padding: 20px; text-align: center;
                  color: #999; font-size: 12px; }
        .emoji { font-size: 48px; display: block; margin-bottom: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>💍 Wedding Memories</h1>
          <p>Your special moments, secured</p>
        </div>
        <div class="body">
          <span class="emoji">${isLogin ? '🔐' : '✉️'}</span>
          <p>You requested to <strong>${actionText}</strong> Wedding Memories.<br/>Use the OTP below:</p>
          <div class="otp-box">
            <div class="otp">${otp}</div>
          </div>
          <div class="expire">⏰ This OTP expires in <strong>${process.env.OTP_EXPIRE_MINUTES || 10} minutes</strong></div>
          <p style="color:#999; font-size:13px;">If you didn't request this, please ignore this email.<br/>Do not share this OTP with anyone.</p>
        </div>
        <div class="footer">
          Wedding Memories © 2026 · Made with ❤️ for your special day
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to:   toEmail,
    subject,
    html,
  });
};

module.exports = { sendOTPEmail };
