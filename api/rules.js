const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}
