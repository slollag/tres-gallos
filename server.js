const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting to prevent spam
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many contact form submissions. Please try again later.'
  }
});

app.use('/api/contact', limiter);

// Email transporter configuration
const createTransporter = () => {
  // Gmail configuration (most common)
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // This should be an App Password, not regular password
      }
    });
  }
  
  // SMTP configuration (for other email providers)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { email, subject, message } = req.body;
    
    // Validation
    if (!email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
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
      subject: `Tres Gallos Question: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0;">New Tres Gallos Question</h2>
          </div>
          
          <div style="background: #f8fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1e40af; margin-top: 0;">Contact Information</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${subject}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h3 style="color: #1e40af; margin-top: 0;">Question</h3>
              <p style="line-height: 1.6; color: #374151;">${message.replace(/\n/g, '<br>')}</p>
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
      subject: 'Thanks for your question to Tres Gallos',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0;">Thank You</h2>
          </div>
          
          <div style="background: #f8fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="color: #1e40af; margin-top: 0;">We've received your question</h3>
              <p style="line-height: 1.6; color: #374151;">
                Thank you for reaching out during your stay. We'll get back to you as soon as possible.
              </p>
              <p style="line-height: 1.6; color: #374151;">
                <strong>Your question details:</strong><br>
                Subject: ${subject}<br>
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
                  If you have more questions, reply to this email.
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
});

// Edge-of-Season details endpoint (for rules form)
app.post('/api/rules', async (req, res) => {
  try {
    const { email, phone, guests, message } = req.body || {};

    if (!email || !Array.isArray(guests) || guests.length === 0 || !message) {
      return res.status(400).json({ success: false, error: 'Email, guests, and message are required' });
    }

    const invalid = guests.some(g => !g || !g.name || !g.age);
    if (invalid) {
      return res.status(400).json({ success: false, error: 'Each guest must include name and age bracket' });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'owner.tresgallos@gmail.com',
      subject: 'Edge-of-Season Guest Details - Tres Gallos',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 16px 20px; border-radius: 10px 10px 0 0;">
            <h2 style="margin:0;">🏠 Edge-of-Season Guest Details</h2>
          </div>
          <div style="padding: 24px; background:#f8fafb; border:1px solid #e2e8f0; border-radius: 0 0 10px 10px;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <div style="margin:12px 0 14px;">
              <h3 style="margin:0 0 8px;color:#1e40af;">Guests</h3>
              <ul>
                ${guests.map(g => `<li><strong>${g.name}</strong> — Approximate age: ${g.age}</li>`).join('')}
              </ul>
            </div>
            <div style="margin-top: 12px; background: white; padding: 16px; border-radius: 8px;">
              <h3 style="margin-top:0;color:#1e40af;">Notes / Questions</h3>
              <p>${String(message).replace(/\n/g,'<br>')}</p>
            </div>
          </div>
        </div>
      `,
      replyTo: email,
    };

    await transporter.sendMail(mailOptions);

    // confirmation mail (optional)
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thanks for the details - Tres Gallos',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0;">Thank You</h2>
          </div>
          
          <div style="background: #f8fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="color: #1e40af; margin-top: 0;">We've received your question</h3>
              <p style="line-height: 1.6; color: #374151;">
                Thank you for sharing your edge-of-season details. If we need any more information, we will reach out to you.
              </p>
              <p style="line-height: 1.6; color: #374151;">
                <strong>Your form details:</strong><br>
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
                  If you have a question or follow-up, reply to this email.
                </p>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    return res.json({ success: true, message: 'Details sent successfully' });
  } catch (err) {
    console.error('Rules email error:', err);
    return res.status(500).json({ success: false, error: 'Failed to send details' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🌊 Tres Gallos server running on http://localhost:${PORT}`);
  console.log(`📧 Email service configured for: ${process.env.EMAIL_USER || 'Not configured'}`);
});