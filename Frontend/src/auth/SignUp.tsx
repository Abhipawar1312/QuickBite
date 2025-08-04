"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { type SignupInputState, userSignupSchema } from "@/schema/userSchema";
import { useUserStore } from "@/store/useUserStore";
import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Icon from "../assets/Icon.png";

const SignUp = () => {
  const [input, setInput] = useState<SignupInputState>({
    fullname: "",
    email: "",
    password: "",
    contact: "",
  });
  const [errors, setErrors] = useState<Partial<SignupInputState>>({});
  const [showPassword, setShowPassword] = useState(false);
  const { signup, loading } = useUserStore();
  const navigate = useNavigate();

  const onChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput({
      ...input,
      [name]: value,
    });
    // Validate only the current field
    const singleFieldSchema =
      userSignupSchema.shape[name as keyof SignupInputState];
    if (singleFieldSchema) {
      const result = singleFieldSchema.safeParse(value);
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name as keyof SignupInputState]: result.success
          ? undefined
          : prevErrors[name as keyof SignupInputState],
      }));
      // Optional: if you want to update the error with new message if still invalid
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: result.success ? undefined : result.error.issues[0].message,
      }));
    }
  };

  const onSubmitHandler = async (e: FormEvent) => {
    e.preventDefault();
    const result = userSignupSchema.safeParse(input);
    if (!result.success) {
      const fieldErrors = result.error.formErrors.fieldErrors;
      setErrors(fieldErrors as Partial<SignupInputState>);
      return;
    }
    try {
      await signup(input);
      navigate("/verify-email");
    } catch (error: any) {
      const message = error.message;
      if (message === "Email already exists") {
        setErrors({ email: message });
      } else if (message === "Contact number already exists") {
        setErrors({ contact: message });
      } else {
        console.error("Unhandled signup error:", message);
      }
    }
  };

  const formFields = [
    { name: "fullname", icon: User, placeholder: "Full Name", type: "text" },
    { name: "email", icon: Mail, placeholder: "Email", type: "email" },
    {
      name: "password",
      icon: LockKeyhole,
      placeholder: "Password",
      type: "password",
    },
    {
      name: "contact",
      icon: Phone,
      placeholder: "Contact Number",
      type: "number",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute top-20 left-20 w-32 h-32 bg-orange-200/20 dark:bg-orange-800/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute bottom-20 right-20 w-40 h-40 bg-blue-200/20 dark:bg-blue-800/20 rounded-full blur-xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-3xl p-8">
          <form onSubmit={onSubmitHandler} className="space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <motion.img
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  src={Icon}
                  alt="QuickBite Logo"
                  className="h-10 w-10 object-contain drop-shadow-lg"
                />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  QuickBite
                </h1>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Create your account
              </p>
            </motion.div>

            {/* Form Fields */}
            {formFields.map((field, index) => {
              const Icon = field.icon;
              const isPassword = field.name === "password";
              return (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Icon className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors duration-300" />
                    </div>
                    <Input
                      type={
                        isPassword
                          ? showPassword
                            ? "text"
                            : "password"
                          : field.type
                      }
                      name={field.name}
                      value={input[field.name as keyof SignupInputState]}
                      onChange={onChangeHandler}
                      placeholder={field.placeholder}
                      className={`${
                        isPassword ? "pl-12 pr-12" : "pl-12 pr-4"
                      } py-3 h-12 bg-white dark:bg-slate-900 border-2 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-500 ${
                        errors?.[field.name as keyof SignupInputState]
                          ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    />
                    {isPassword && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-300 z-10"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    )}
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-600/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                      layoutId={`inputGlow${index}`}
                    />
                  </div>
                  {errors?.[field.name as keyof SignupInputState] && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500 ml-1"
                    >
                      {errors[field.name as keyof SignupInputState]}
                    </motion.p>
                  )}
                </motion.div>
              );
            })}

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {loading ? (
                <Button
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
                  disabled
                >
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Signing up...
                </Button>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  >
                    Sign Up
                  </Button>
                </motion.div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Separator className="bg-slate-200 dark:bg-slate-700" />
            </motion.div>

            {/* Login link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-center"
            >
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors duration-300"
                >
                  Login
                </Link>
              </p>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;
