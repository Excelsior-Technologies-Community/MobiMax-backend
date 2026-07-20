import nodemailer from 'nodemailer';

let transporterInstance = null;

// Create a transporter dynamically
const getTransporter = async () => {
  if (transporterInstance) return transporterInstance;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && !process.env.SMTP_HOST.includes('ethereal')) {
    transporterInstance = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporterInstance;
  }
  
  // Fallback to dynamic Ethereal if no valid SMTP is configured
  console.log('Generating dynamic Ethereal Test Account for emails...');
  const testAccount = await nodemailer.createTestAccount();
  transporterInstance = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  return transporterInstance;
};

export const sendWelcomeEmail = async (email, name, role) => {
  try {
    const isPartner = role === 'partner';
    const subject = isPartner 
      ? 'Welcome to MobiMax - Partner Portal' 
      : 'Welcome to MobiMax!';
      
    const text = isPartner
      ? `Hi ${name},\n\nThank you for signing up as a partner with MobiMax! We're excited to have you on board.\nYour application is currently pending review. We will notify you once it has been approved.\n\nBest Regards,\nThe MobiMax Team`
      : `Hi ${name},\n\nWelcome to MobiMax! Your account has been created successfully.\nExplore our platform and start shopping today.\n\nBest Regards,\nThe MobiMax Team`;

    const getHtmlTemplate = (title, message, buttonText, buttonLink, isPartner) => {
      const headerGradient = isPartner ? 'linear-gradient(135deg, #111827 0%, #374151 100%)' : 'linear-gradient(135deg, #e26a1b 0%, #f97316 100%)';
      const highlightBorder = isPartner ? '#111827' : '#e26a1b';
      const buttonBg = isPartner ? '#e26a1b' : '#111827';
      const subtitle = isPartner ? 'Partner Portal' : 'Your Ultimate Shopping Destination';
      
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
    
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background-color: #f4f5f7; padding: 60px 20px; box-sizing: border-box; }
    .main-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); }
    
    .header { background: ${headerGradient}; padding: 50px 20px; text-align: center; position: relative; overflow: hidden; }
    .header::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml;utf8,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.05)"/></svg>') repeat; opacity: 0.5; }
    .header-logo { position: relative; z-index: 1; font-size: 42px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -1.5px; text-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    .header-subtitle { position: relative; z-index: 1; color: rgba(255,255,255,0.95); font-size: 16px; margin-top: 12px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; }
    
    .content-area { padding: 50px 40px; text-align: center; }
    .greeting { color: #111827; font-size: 28px; font-weight: 800; margin-top: 0; margin-bottom: 25px; letter-spacing: -0.5px; }
    .message-text { color: #4b5563; font-size: 16px; line-height: 1.8; margin-bottom: 35px; }
    
    .highlight-box { background: linear-gradient(to right, #fff7f2, #ffffff); border-left: 4px solid ${highlightBorder}; border-radius: 0 12px 12px 0; padding: 25px; margin-bottom: 40px; text-align: left; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .highlight-title { color: #9a3412; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0; }
    .highlight-text { color: #431407; font-size: 15px; margin: 0; line-height: 1.6; font-weight: 500; }
    
    .cta-wrapper { margin-top: 10px; margin-bottom: 20px; }
    .cta-button { background-color: ${buttonBg}; color: #ffffff !important; padding: 18px 42px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.3s ease; box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.25); letter-spacing: 0.5px; }
    
    .footer { background-color: #f9fafb; padding: 40px; text-align: center; border-top: 1px solid #f3f4f6; }
    .social-links { margin-bottom: 25px; }
    .social-link { display: inline-block; margin: 0 15px; color: #6b7280; text-decoration: none; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .footer-text { color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0; }
    
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 20px 10px; }
      .content-area { padding: 40px 20px; }
      .header { padding: 40px 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main-container">
      <div class="header">
        <h1 class="header-logo">MobiMax</h1>
        <div class="header-subtitle">${subtitle}</div>
      </div>
      <div class="content-area">
        <h2 class="greeting">Welcome, ${name}! 🎉</h2>
        <div class="message-text">
          ${message}
        </div>
        <div class="cta-wrapper">
          <a href="${buttonLink}" class="cta-button">${buttonText}</a>
        </div>
      </div>
      <div class="footer">
        <div class="social-links">
          <a href="#" class="social-link">Twitter</a>
          <a href="#" class="social-link">Instagram</a>
          <a href="#" class="social-link">Facebook</a>
        </div>
        <p class="footer-text">&copy; ${new Date().getFullYear()} MobiMax Inc. All rights reserved.</p>
        <p class="footer-text" style="font-size: 11px;">You are receiving this email because you recently registered an account with MobiMax. If you did not make this request, please ignore this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
    };

    const html = isPartner
      ? getHtmlTemplate(
          'Welcome to MobiMax',
          `<p>Thank you for applying to become a partner with MobiMax! We are incredibly excited about the possibility of collaborating with your business.</p>
           <div class="highlight-box">
             <p class="highlight-title">Application Status</p>
             <p class="highlight-text">Your application is currently <strong>Pending Review</strong>. Our team is carefully reviewing your details. We will notify you the moment your partner account is approved!</p>
           </div>`,
          'Go to Partner Portal',
          'http://localhost:5173/partner/login',
          true
        )
      : getHtmlTemplate(
          'Welcome to MobiMax',
          `<p>We are absolutely thrilled to have you join the MobiMax family! Your account has been successfully created and is ready to go.</p>
           <div class="highlight-box">
             <p class="highlight-title">What's Next?</p>
             <p class="highlight-text">Get ready to discover an unparalleled selection of products, unbeatable deals, and a shopping experience tailored just for you.</p>
           </div>`,
          'Start Shopping Now',
          'http://localhost:5173/',
          false
        );

    const mailOptions = {
      from: process.env.SMTP_FROM || '"MobiMax" <noreply@mobimax.com>',
      to: email,
      subject,
      text,
      html,
    };

    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email} [Message ID: ${info.messageId}]`);
    if (!process.env.SMTP_HOST || process.env.SMTP_HOST.includes('ethereal')) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return info;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error to prevent registration from failing if email fails
  }
};

export const sendSuspensionEmail = async (email, name, role) => {
  try {
    const isPartner = role === 'partner';
    const subject = isPartner 
      ? 'Action Required: Partner Account Suspended' 
      : 'Action Required: Account Suspended';
      
    const text = `Hi ${name},\n\nYour account has been suspended by the administration team.\nIf you believe this is a mistake, please contact our support team.\n\nBest Regards,\nThe MobiMax Team`;

    const getHtmlTemplate = (message, buttonText, buttonLink) => {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
    
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background-color: #f4f5f7; padding: 60px 20px; box-sizing: border-box; }
    .main-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); }
    
    .header { background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); padding: 50px 20px; text-align: center; position: relative; overflow: hidden; }
    .header::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml;utf8,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.05)"/></svg>') repeat; opacity: 0.5; }
    .header-logo { position: relative; z-index: 1; font-size: 42px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -1.5px; text-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    .header-subtitle { position: relative; z-index: 1; color: rgba(255,255,255,0.95); font-size: 16px; margin-top: 12px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; }
    
    .content-area { padding: 50px 40px; text-align: center; }
    .greeting { color: #111827; font-size: 28px; font-weight: 800; margin-top: 0; margin-bottom: 25px; letter-spacing: -0.5px; }
    .message-text { color: #4b5563; font-size: 16px; line-height: 1.8; margin-bottom: 35px; }
    
    .highlight-box { background: linear-gradient(to right, #fef2f2, #ffffff); border-left: 4px solid #ef4444; border-radius: 0 12px 12px 0; padding: 25px; margin-bottom: 40px; text-align: left; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .highlight-title { color: #b91c1c; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0; }
    .highlight-text { color: #7f1d1d; font-size: 15px; margin: 0; line-height: 1.6; font-weight: 500; }
    
    .cta-wrapper { margin-top: 10px; margin-bottom: 20px; }
    .cta-button { background-color: #ef4444; color: #ffffff !important; padding: 18px 42px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.3s ease; box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.4); letter-spacing: 0.5px; }
    
    .footer { background-color: #f9fafb; padding: 40px; text-align: center; border-top: 1px solid #f3f4f6; }
    .footer-text { color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0; }
    
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 20px 10px; }
      .content-area { padding: 40px 20px; }
      .header { padding: 40px 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main-container">
      <div class="header">
        <h1 class="header-logo">MobiMax</h1>
        <div class="header-subtitle">Account Notice</div>
      </div>
      <div class="content-area">
        <h2 class="greeting">Hi ${name},</h2>
        <div class="message-text">
          ${message}
        </div>
        <div class="cta-wrapper">
          <a href="${buttonLink}" class="cta-button">${buttonText}</a>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">&copy; ${new Date().getFullYear()} MobiMax Inc. All rights reserved.</p>
        <p class="footer-text" style="font-size: 11px;">You are receiving this email because your account status has changed. If you believe this is a mistake, please contact support.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
    };

    const html = getHtmlTemplate(
      `<p>Your access to MobiMax has been temporarily suspended by our administration team.</p>
       <div class="highlight-box">
         <p class="highlight-title">Important Notice</p>
         <p class="highlight-text">You will not be able to log in or access your account until this issue is resolved. If you believe this is a mistake, please reach out to our support team for further assistance.</p>
       </div>`,
      'Contact Support',
      'mailto:support@mobimax.com'
    );

    const mailOptions = {
      from: process.env.SMTP_FROM || '"MobiMax" <noreply@mobimax.com>',
      to: email,
      subject,
      text,
      html,
    };

    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`Suspension email sent to ${email} [Message ID: ${info.messageId}]`);
    if (!process.env.SMTP_HOST || process.env.SMTP_HOST.includes('ethereal')) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return info;
  } catch (error) {
    console.error('Error sending suspension email:', error);
  }
};

export const sendPartnerApprovalEmail = async (email, name) => {
  try {
    const subject = 'Congratulations! Your Partner Account is Approved';
      
    const text = `Hi ${name},\n\nGreat news! Your partner application has been approved by our administration team.\nYou can now log in to your partner portal and start managing your store.\n\nBest Regards,\nThe MobiMax Team`;

    const getHtmlTemplate = (message, buttonText, buttonLink) => {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
    
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background-color: #f4f5f7; padding: 60px 20px; box-sizing: border-box; }
    .main-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); }
    
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 50px 20px; text-align: center; position: relative; overflow: hidden; }
    .header::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml;utf8,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.05)"/></svg>') repeat; opacity: 0.5; }
    .header-logo { position: relative; z-index: 1; font-size: 42px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -1.5px; text-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    .header-subtitle { position: relative; z-index: 1; color: rgba(255,255,255,0.95); font-size: 16px; margin-top: 12px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; }
    
    .content-area { padding: 50px 40px; text-align: center; }
    .greeting { color: #111827; font-size: 28px; font-weight: 800; margin-top: 0; margin-bottom: 25px; letter-spacing: -0.5px; }
    .message-text { color: #4b5563; font-size: 16px; line-height: 1.8; margin-bottom: 35px; }
    
    .highlight-box { background: linear-gradient(to right, #ecfdf5, #ffffff); border-left: 4px solid #10b981; border-radius: 0 12px 12px 0; padding: 25px; margin-bottom: 40px; text-align: left; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .highlight-title { color: #047857; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0; }
    .highlight-text { color: #064e3b; font-size: 15px; margin: 0; line-height: 1.6; font-weight: 500; }
    
    .cta-wrapper { margin-top: 10px; margin-bottom: 20px; }
    .cta-button { background-color: #10b981; color: #ffffff !important; padding: 18px 42px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.3s ease; box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4); letter-spacing: 0.5px; }
    
    .footer { background-color: #f9fafb; padding: 40px; text-align: center; border-top: 1px solid #f3f4f6; }
    .footer-text { color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0; }
    
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 20px 10px; }
      .content-area { padding: 40px 20px; }
      .header { padding: 40px 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main-container">
      <div class="header">
        <h1 class="header-logo">MobiMax</h1>
        <div class="header-subtitle">Application Approved</div>
      </div>
      <div class="content-area">
        <h2 class="greeting">Hi ${name}, 🎉</h2>
        <div class="message-text">
          ${message}
        </div>
        <div class="cta-wrapper">
          <a href="${buttonLink}" class="cta-button">${buttonText}</a>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">&copy; ${new Date().getFullYear()} MobiMax Inc. All rights reserved.</p>
        <p class="footer-text" style="font-size: 11px;">You are receiving this email because your partner application was just approved by our team.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
    };

    const html = getHtmlTemplate(
      `<p>Great news! Your partner application and KYC documents have been fully verified and approved by the MobiMax administration team.</p>
       <div class="highlight-box">
         <p class="highlight-title">You're Ready to Go!</p>
         <p class="highlight-text">Your store is now fully activated. You can log into the Partner Portal immediately to start managing your catalog, setting up your inventory, and reaching thousands of customers.</p>
       </div>`,
      'Log into Partner Portal',
      'http://localhost:5173/partner/login'
    );

    const mailOptions = {
      from: process.env.SMTP_FROM || '"MobiMax" <noreply@mobimax.com>',
      to: email,
      subject,
      text,
      html,
    };

    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`Approval email sent to ${email} [Message ID: ${info.messageId}]`);
    if (!process.env.SMTP_HOST || process.env.SMTP_HOST.includes('ethereal')) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return info;
  } catch (error) {
    console.error('Error sending approval email:', error);
  }
};

export const sendPasswordResetEmail = async (email, name, resetLink, role) => {
  try {
    const isPartner = role === 'partner';
    const subject = 'Password Reset Request - MobiMax';
      
    const text = `Hi ${name},\n\nYou requested a password reset for your MobiMax account.\nPlease click the following link to reset your password: ${resetLink}\n\nIf you did not request this, please ignore this email.\n\nBest Regards,\nThe MobiMax Team`;

    const getHtmlTemplate = (message, buttonText, buttonLink) => {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
    
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background-color: #f4f5f7; padding: 60px 20px; box-sizing: border-box; }
    .main-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); }
    
    .header { background: linear-gradient(135deg, #e26a1b 0%, #f97316 100%); padding: 50px 20px; text-align: center; position: relative; overflow: hidden; }
    .header::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml;utf8,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.05)"/></svg>') repeat; opacity: 0.5; }
    .header-logo { position: relative; z-index: 1; font-size: 42px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -1.5px; text-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    .header-subtitle { position: relative; z-index: 1; color: rgba(255,255,255,0.95); font-size: 16px; margin-top: 12px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; }
    
    .content-area { padding: 50px 40px; text-align: center; }
    .greeting { color: #111827; font-size: 28px; font-weight: 800; margin-top: 0; margin-bottom: 25px; letter-spacing: -0.5px; }
    .message-text { color: #4b5563; font-size: 16px; line-height: 1.8; margin-bottom: 35px; }
    
    .highlight-box { background: linear-gradient(to right, #fff7f2, #ffffff); border-left: 4px solid #e26a1b; border-radius: 0 12px 12px 0; padding: 25px; margin-bottom: 40px; text-align: left; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .highlight-title { color: #9a3412; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0; }
    .highlight-text { color: #431407; font-size: 15px; margin: 0; line-height: 1.6; font-weight: 500; }
    
    .cta-wrapper { margin-top: 10px; margin-bottom: 20px; }
    .cta-button { background-color: #e26a1b; color: #ffffff !important; padding: 18px 42px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.3s ease; box-shadow: 0 10px 20px -5px rgba(226, 106, 27, 0.4); letter-spacing: 0.5px; }
    
    .footer { background-color: #f9fafb; padding: 40px; text-align: center; border-top: 1px solid #f3f4f6; }
    .footer-text { color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0; }
    
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 20px 10px; }
      .content-area { padding: 40px 20px; }
      .header { padding: 40px 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main-container">
      <div class="header">
        <h1 class="header-logo">MobiMax</h1>
        <div class="header-subtitle">Password Reset</div>
      </div>
      <div class="content-area">
        <h2 class="greeting">Hi ${name},</h2>
        <div class="message-text">
          ${message}
        </div>
        <div class="cta-wrapper">
          <a href="${buttonLink}" class="cta-button">${buttonText}</a>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">&copy; ${new Date().getFullYear()} MobiMax Inc. All rights reserved.</p>
        <p class="footer-text" style="font-size: 11px;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
    };

    const html = getHtmlTemplate(
      `<p>We received a request to reset your password for your MobiMax account.</p>
       <div class="highlight-box">
         <p class="highlight-title">Reset Your Password</p>
         <p class="highlight-text">Click the button below to choose a new password. This link will expire in 1 hour.</p>
       </div>`,
      'Reset Password',
      resetLink
    );

    const mailOptions = {
      from: process.env.SMTP_FROM || '"MobiMax" <noreply@mobimax.com>',
      to: email,
      subject,
      text,
      html,
    };

    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email} [Message ID: ${info.messageId}]`);
    if (!process.env.SMTP_HOST || process.env.SMTP_HOST.includes('ethereal')) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

export const sendContactReplyEmail = async (email, name, replyMessage, originalMessage) => {
  try {
    const subject = 'Reply to your inquiry - MobiMax';
      
    const text = `Hi ${name},\n\nThank you for contacting MobiMax. Here is our reply to your recent message:\n\n${replyMessage}\n\nYour original message:\n"${originalMessage}"\n\nBest Regards,\nThe MobiMax Team`;

    const getHtmlTemplate = (reply, original) => {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
    
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background-color: #f4f5f7; padding: 60px 20px; box-sizing: border-box; }
    .main-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); }
    
    .header { background: linear-gradient(135deg, #e26a1b 0%, #f97316 100%); padding: 40px 20px; text-align: center; position: relative; overflow: hidden; }
    .header::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml;utf8,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.05)"/></svg>') repeat; opacity: 0.5; }
    .header-logo { position: relative; z-index: 1; font-size: 32px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -1px; text-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    
    .content-area { padding: 40px; text-align: left; }
    .greeting { color: #111827; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 20px; }
    .message-text { color: #4b5563; font-size: 16px; line-height: 1.8; margin-bottom: 30px; white-space: pre-wrap; }
    
    .original-message-box { background-color: #f9fafb; border-left: 4px solid #d1d5db; border-radius: 0 8px 8px 0; padding: 20px; margin-bottom: 30px; }
    .original-title { color: #6b7280; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; }
    .original-text { color: #4b5563; font-size: 14px; margin: 0; line-height: 1.6; font-style: italic; white-space: pre-wrap; }
    
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #f3f4f6; }
    .footer-text { color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main-container">
      <div class="header">
        <h1 class="header-logo">MobiMax</h1>
      </div>
      <div class="content-area">
        <h2 class="greeting">Hi ${name},</h2>
        <div class="message-text">${reply}</div>
        
        <div class="original-message-box">
          <p class="original-title">Your Message</p>
          <p class="original-text">${original}</p>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">&copy; ${new Date().getFullYear()} MobiMax Inc. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
    };

    const html = getHtmlTemplate(replyMessage, originalMessage);

    const mailOptions = {
      from: process.env.SMTP_FROM || '"MobiMax" <noreply@mobimax.com>',
      to: email,
      subject,
      text,
      html,
    };

    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`Contact reply email sent to ${email} [Message ID: ${info.messageId}]`);
    if (!process.env.SMTP_HOST || process.env.SMTP_HOST.includes('ethereal')) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return info;
  } catch (error) {
    console.error('Error sending contact reply email:', error);
  }
};

