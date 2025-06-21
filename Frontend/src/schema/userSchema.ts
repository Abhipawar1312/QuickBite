import { z } from 'zod';

export const userSignupSchema = z.object({
    fullname: z.string().min(1, "Fullname is required"),
    email: z.string().email("Invalid Email Address"),
    password: z.string().min(6, "Password must be atleast 6 characters"),
    contact: z
        .string()
        .regex(/^\d{10}$/, "Contact Number must be exactly 10 digits"),
});

export type SignupInputState = z.infer<typeof userSignupSchema>;

export const userLoginSchema = z.object({
    email: z.string().email("Invalid Email Address"),
    password: z.string().min(6, "Password must be atleast 6 characters"),
});

export type LoginInputState = z.infer<typeof userLoginSchema>;