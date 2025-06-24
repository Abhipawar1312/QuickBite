// utils/sendgrid.ts
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import { htmlContent, generateWelcomeEmailHtml, generatePasswordResetEmailHtml, generateResetSuccessEmailHtml } from "../mailtrap/htmlEmail";
// import {
//     generatePasswordResetEmailHtml,
//     generateResetSuccessEmailHtml,
//     generateWelcomeEmailHtml,
//     htmlContent,
// } from "./htmlEmail";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const senderEmail = "abhipawar131202@gmail.com"; // Must match your verified sender

export const sendEmail = async (to: string, subject: string, html: string) => {
    const msg = {
        to,
        from: {
            email: senderEmail,
            name: "QuickBite Team",
        },
        subject,
        html,
    };

    try {
        const res = await sgMail.send(msg);
        console.log("✅ Email sent to:", to);
        return res;
    } catch (error: any) {
        console.error("❌ Email sending error:", error.response?.body || error.message);
        throw new Error("Failed to send email");
    }
};

export const sendVerificationEmail = async (email: string, token: string) => {
    const finalHtml = htmlContent.replace("{verificationToken}", token);
    await sendEmail(email, "Verify your email", finalHtml);
};

export const sendWelcomeEmail = async (email: string, name: string) => {
    const html = generateWelcomeEmailHtml(name);
    await sendEmail(email, "Welcome to QuickBite", html);
};

export const sendPasswordResetEmail = async (email: string, resetURL: string) => {
    const html = generatePasswordResetEmailHtml(resetURL);
    await sendEmail(email, "Reset your password", html);
};

export const sendResetSuccessEmail = async (email: string) => {
    const html = generateResetSuccessEmailHtml();
    await sendEmail(email, "Password Reset Successfully", html);
};
