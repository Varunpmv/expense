import nodemailer from 'nodemailer';
import { prisma } from './prisma';

export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'SMTP_CONFIG' },
    });

    let transporter;
    let fromEmail = '"ExpenseHub" <no-reply@expensehub.local>';

    if (setting) {
      const config = JSON.parse(setting.value);
      transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });
      fromEmail = config.from;
    } else {
      // Fallback to mock transport
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
    }

    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      text,
      html: html || text,
    });

    if (!setting) {
      console.log('\n=======================================');
      console.log(`📧 MOCK EMAIL DISPATCHED TO: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('---------------------------------------');
      console.log(info.message.toString());
      console.log('=======================================\n');
    } else {
      console.log(`📧 Actual email sent to ${to}: ${info.messageId}`);
    }
    
  } catch (err) {
    console.error('Failed to send email:', err);
  }
}
