import { Request, Response } from "express";
import { User } from "../models/user.model";
import { Rider } from "../models/rider.model";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import cloudinary from "../utils/cloudinary";
import { generateVerificationCode } from "../utils/generateVerificationCode";
import { generateToken } from "../utils/generateToken";
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendResetSuccessEmail } from "../utils/sendgrid";
// import { sendPasswordResetEmail, sendResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail } from "../mailtrap/email";
// import {
//     sendPasswordResetEmail,
//     sendResetSuccessEmail,
//     sendVerificationEmail,
//     sendWelcomeEmail
// } from "../utils/sendgrid";

export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullname, email, password, contact, role } = req.body;

        const userByEmail = await User.findOne({ email });
        if (userByEmail) {
            res.status(400).json({ success: false, message: "Email already exists" });
            return;
        }

        const userByContact = await User.findOne({ contact });
        if (userByContact) {
            res.status(400).json({ success: false, message: "Contact number already exists" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = generateVerificationCode();

        const adminEmail = process.env.ADMIN_EMAIL || "admin@quickbite.com";
        const isSystemAdmin = email.toLowerCase() === adminEmail.toLowerCase();
        const finalRole = isSystemAdmin ? 'admin' : (role || 'user');

        const user = await User.create({
            fullname,
            email,
            password: hashedPassword,
            contact: Number(contact),
            role: finalRole,
            admin: finalRole === 'restaurant_owner' || finalRole === 'admin',
            isRoleSelected: true,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
        });

        generateToken(res, user);
        await sendVerificationEmail(email, verificationToken);

        const userWithoutPassword = await User.findOne({ email }).select("-password");

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            user: userWithoutPassword,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({
                success: false,
                message: "Incorrect email or password",
            });
            return;
        }
        if (!user.password) {
            res.status(400).json({
                success: false,
                message: "Incorrect email or password",
            });
            return;
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            res.status(400).json({
                success: false,
                message: "Incorrect email or password",
            });
            return;
        }
        generateToken(res, user);
        user.lastLogin = new Date();
        await user.save();
        const userWithoutPassword = await User.findOne({ email }).select("-password");
        res.status(200).json({
            success: true,
            message: `Welcome Back ${user.fullname}`,
            user: userWithoutPassword
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { verificationCode } = req.body;
        const user = await User.findOne({
            verificationToken: verificationCode,
            verificationTokenExpiresAt: { $gt: Date.now() }
        }).select("-password");
        if (!user) {
            res.status(400).json({
                success: false,
                message: "Invalid or expired verification code",
            });
            return;
        }
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();

        // Send welcome email
        await sendWelcomeEmail(user.email, user.fullname);
        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        res.clearCookie("token");
        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const forgetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({
                success: false,
                message: "User doesn't exist",
            });
            return;
        }
        const resetToken = crypto.randomBytes(40).toString('hex');
        const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
        user.resetPasswordToken = resetToken;
        user.resetPasswordTokenExpiresAt = resetTokenExpiresAt;
        await user.save();

        // Send password reset email
        await sendPasswordResetEmail(user.email, `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`);

        res.status(200).json({
            success: true,
            message: "Password reset Link sent to your email",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordTokenExpiresAt: { $gt: Date.now() }
        });
        if (!user) {
            res.status(400).json({
                success: false,
                message: "Invalid or expired reset token",
            });
            return;
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpiresAt = undefined;
        await user.save();
        await sendResetSuccessEmail(user.email);
        res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const checkAuth = async (req: Request, res: Response): Promise<void> => {
    try {
        const userid = req.id;
        const user = await User.findById(userid).select("-password");
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User Not Found"
            });
            return;
        }
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userid = req.id;
        const { fullname, email, contact, address, city, country, profilePicture, vehicleName, licenseNumber, latitude, longitude } = req.body;
        
        let profilePictureUrl = profilePicture;

        if (profilePicture && !profilePicture.startsWith("http")) {
            const cloudResponse = await cloudinary.uploader.upload(profilePicture);
            profilePictureUrl = cloudResponse.url;
        }

        // Only include contact in update if a non-empty value was provided
        const updatedData: any = { fullname, email, address, city, country, profilePicture: profilePictureUrl };
        if (contact !== undefined && contact !== null && contact !== "") {
            updatedData.contact = Number(contact);
        }
        const user = await User.findByIdAndUpdate(userid, updatedData, { new: true }).select("-password");

        // If user is a rider, also update/create their Rider profile details
        if (user && user.role === "rider") {
            const riderUpdate: any = {};
            if (vehicleName) riderUpdate.vehicleName = vehicleName;
            if (licenseNumber) riderUpdate.licenseNumber = licenseNumber;
            if (contact !== undefined && contact !== null && contact !== "") {
                riderUpdate.contact = String(contact);
            }
            if (latitude !== undefined && longitude !== undefined) {
                riderUpdate.location = {
                    type: "Point",
                    coordinates: [Number(longitude), Number(latitude)]
                };
            }

            if (Object.keys(riderUpdate).length > 0) {
                await Rider.findOneAndUpdate(
                    { user: userid },
                    riderUpdate,
                    { new: true, upsert: true }
                );
            }
        }

        res.status(200).json({
            success: true,
            user,
            message: "Profile Updated Successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            res.status(400).json({ success: false, message: "ID Token is required" });
            return;
        }

        // Verify ID Token via Google API
        const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (!googleResponse.ok) {
            res.status(400).json({ success: false, message: "Invalid Google Token" });
            return;
        }

        const payload = (await googleResponse.json()) as any;
        
        // Verify the audience matches our GOOGLE_CLIENT_ID if it is set in env
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (clientId && payload.aud !== clientId) {
            res.status(400).json({ success: false, message: "Token audience mismatch" });
            return;
        }

        const { email, name, picture } = payload;
        if (!email) {
            res.status(400).json({ success: false, message: "Email not provided by Google" });
            return;
        }

        let user = await User.findOne({ email });

        if (user) {
            user.lastLogin = new Date();
            // Update profile picture if user doesn't have one and Google provides one
            if (!user.profilePicture && picture) {
                user.profilePicture = picture;
            }
            // Mark verified since Google email is verified
            if (!user.isVerified) {
                user.isVerified = true;
            }
            await user.save();

            generateToken(res, user);
            const userWithoutPassword = await User.findOne({ email }).select("-password");

            res.status(200).json({
                success: true,
                message: `Welcome Back ${user.fullname}`,
                user: userWithoutPassword,
            });
        } else {
            const adminEmail = process.env.ADMIN_EMAIL || "admin@quickbite.com";
            const isSystemAdmin = email.toLowerCase() === adminEmail.toLowerCase();
            const finalRole = isSystemAdmin ? 'admin' : 'user';

            // Create user
            user = await User.create({
                fullname: name || "Google User",
                email,
                profilePicture: picture || "",
                role: finalRole,
                admin: finalRole === 'admin',
                isRoleSelected: isSystemAdmin ? true : false,
                isVerified: true,
                verificationToken: undefined,
                verificationTokenExpiresAt: undefined,
            });

            generateToken(res, user);
            
            try {
                await sendWelcomeEmail(user.email, user.fullname);
            } catch (emailError) {
                console.log("Welcome email failed to send:", emailError);
            }

            const userWithoutPassword = await User.findOne({ email }).select("-password");

            res.status(201).json({
                success: true,
                message: "Account created successfully with Google",
                user: userWithoutPassword,
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const selectRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role } = req.body;
        if (!['user', 'restaurant_owner', 'rider'].includes(role)) {
            res.status(400).json({ success: false, message: "Invalid role selected." });
            return;
        }
        const user = await User.findById(req.id);
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        user.role = role;
        user.admin = role === 'restaurant_owner' || role === 'admin';
        user.isRoleSelected = true;
        await user.save();
        
        const userWithoutPassword = await User.findById(req.id).select("-password");
        res.status(200).json({
            success: true,
            message: "Role selected successfully",
            user: userWithoutPassword
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

