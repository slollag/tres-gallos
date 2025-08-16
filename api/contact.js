const nodemailer = require('nodemailer');

// Create transporter function
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, subject, message, question } = req.body || {};
    const normalizedSubject = subject || 'Guest question';
    const normalizedMessage = message || question;
    
    // Validation
    if (!email || !normalizedMessage) {
      return res.status(400).json({
        success: false,
        error: 'Email and message are required'
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }
    
    // Create transporter
    const transporter = createTransporter();
    
    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'owner.tresgallos@gmail.com',
      subject: `Tres Gallos Inquiry: ${normalizedSubject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0;">🏖️ New Tres Gallos Inquiry</h2>
          </div>
          
          <div style="background: #f8fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1e40af; margin-top: 0;">Contact Information</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${normalizedSubject}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h3 style="color: #1e40af; margin-top: 0;">Message</h3>
              <p style="line-height: 1.6; color: #374151;">${String(normalizedMessage).replace(/\n/g, '<br>')}</p>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>Reply to:</strong> ${email}<br>
                <strong>Received:</strong> ${new Date().toLocaleString('en-US', { 
                  timeZone: 'America/New_York',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} EST
              </p>
            </div>
          </div>
        </div>
      `,
      replyTo: email
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    // Send confirmation email to guest
    const confirmationOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting Tres Gallos!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0;">🏖️ Thank You!</h2>
          </div>
          
          <div style="background: #f8fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="color: #1e40af; margin-top: 0;">We've received your inquiry!</h3>
              <p style="line-height: 1.6; color: #374151;">
                Thank you for your interest in Tres Gallos, our Cape Cod vacation rental. 
                We've received your message and will get back to you as soon as possible.
              </p>
              <p style="line-height: 1.6; color: #374151;">
                <strong>Your inquiry details:</strong><br>
                Subject: ${normalizedSubject}<br>
                Sent: ${new Date().toLocaleString('en-US', { 
                  timeZone: 'America/New_York',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} EST
              </p>
              <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-radius: 8px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  <strong>Questions?</strong> Feel free to reply to this email or visit our website.
                </p>
              </div>
            </div>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(confirmationOptions);
    
    res.json({
      success: true,
      message: 'Your message has been sent successfully!'
    });
    
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message. Please try again later.'
    });
  }
}