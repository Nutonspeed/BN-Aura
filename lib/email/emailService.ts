// Email Service for Staff Invitations
interface InvitationEmailData {
  email: string;
  clinicName: string;
  inviterName: string;
  role: string;
  invitationUrl: string;
  expiresAt: string;
}

// Send staff invitation email
export async function sendInvitationEmail(data: InvitationEmailData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  
  const emailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">เชิญเข้าร่วมทีม ${data.clinicName}</h2>
      <p>คุณได้รับเชิญให้เข้าร่วมทีมในฐานะ <strong>${data.role}</strong></p>
      <p>จาก: ${data.inviterName}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.invitationUrl}" 
           style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;">
          ยืนยันการเข้าร่วม
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">ลิงก์จะหมดอายุ: ${new Date(data.expiresAt).toLocaleDateString('th-TH')}</p>
    </div>
  `;

  if (apiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'BN-Aura <noreply@bn-aura.com>',
          to: data.email,
          subject: `เชิญเข้าร่วมทีม ${data.clinicName} - BN-Aura`,
          html: emailHTML,
        }),
      });

      if (!response.ok) {
        throw new Error(`Email failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Email error:', error);
      throw error;
    }
  } else {
    // Fallback: Log email (for development)
    console.log('📧 [MOCK EMAIL]');
    console.log('To:', data.email);
    console.log('Subject: เชิญเข้าร่วมทีม', data.clinicName);
    console.log('URL:', data.invitationUrl);
  }
}
