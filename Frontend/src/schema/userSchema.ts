import { z } from 'zod';

export const userSignupSchema = z.object({
    fullname: z.string().min(1, "Fullname is required"),
    email: z.string().email("Invalid Email Adress"),
    password: z.string().min(6, "Password must be atleast 6 characters"),
    contact: z.string().min(10, "Contact Number Must be 10 Digits").max(10),
});

export type SignupInputState = z.infer<typeof userSignupSchema>;

export const userLoginSchema = z.object({
    email: z.string().email("Invalid Email Adress"),
    password: z.string().min(6, "Password must be atleast 6 characters"),
});

export type LoginInputState = z.infer<typeof userLoginSchema>;