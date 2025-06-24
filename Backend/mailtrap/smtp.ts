import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const smtpTransporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: Number(process.env.MAILTRAP_SMTP_PORT),
    auth: {
        user: process.env.MAILTRAP_SMTP_USER!,
        pass: process.env.MAILTRAP_SMTP_PASS!,
    },
});

// ✅ Add this:
smtpTransporter.verify()
    .then(() => console.log("🔌 SMTP transporter is ready"))
    .catch(err => console.error("❌ SMTP transporter failed:", err));