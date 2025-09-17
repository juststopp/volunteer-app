import Nodemailer from "nodemailer";

import { generatePasswordResetEmailHtml } from "@/components/mails/password-reset";

const transporter = Nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

await transporter.verify();

export async function sendResetPasswordMail(options: {
  to: { name: string; email: string };
  subject: string;
  resetToken: string;
}) {
  const html = generatePasswordResetEmailHtml({
    prenom: options.to.name,
    email: options.to.email,
    emailSupport: "contact@sheva.fr",
    resetUrl: `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${options.resetToken}`
  });

  const mailOptions = {
    from: `<${process.env.SMTP_FROM}>`,
    to: options.to.email,
    subject: options.subject,
    html: html,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Error sending email");
  }
}