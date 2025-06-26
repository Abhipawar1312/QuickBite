import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/store/useUserStore";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const ForgetPassword = () => {
  const [email, setEmail] = useState<string>("");
  const { loading, forgotPassword } = useUserStore();
  const navigate = useNavigate();

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword(email);
      navigate("/");
    } catch (error) {
      console.error("Reset link error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={submitHandler}
        className="w-full max-w-md bg-white border border-gray-200 shadow-md rounded-2xl p-8 space-y-6"
      >
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Forgot Password
          </h1>
          <p className="text-sm text-gray-600">
            Enter your email address to receive a password reset link.
          </p>
        </div>

        {/* Email Input */}
        <div className="relative">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="pl-10 pr-3 text-gray-900"
            required
          />
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Submit Button */}
        {loading ? (
          <Button disabled className="w-full bg-sky-blue hover:bg-sky-blue">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </Button>
        ) : (
          <Button
            type="submit"
            className="w-full bg-sky-blue hover:bg-sky-blue text-white"
          >
            Send Reset Link
          </Button>
        )}

        {/* Navigation Link */}
        <p className="text-sm text-center text-gray-600">
          Back to{" "}
          <Link
            to="/login"
            className="text-blue-500 font-medium hover:underline"
          >
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default ForgetPassword;
