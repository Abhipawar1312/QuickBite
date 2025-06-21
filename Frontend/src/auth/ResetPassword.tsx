import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/store/useUserStore";
import { Loader2, LockKeyhole, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState<string>("");
  const { loading, resetPassword } = useUserStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { token } = useParams();

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await resetPassword(token!, newPassword);
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={submitHandler}
        className="w-full max-w-md bg-white border border-gray-200 shadow-md rounded-2xl p-8 space-y-6"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            Reset Password
          </h1>
          <p className="text-sm text-gray-600">
            Enter your new password below to update your account
          </p>
        </div>

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            className="pl-10 pr-10"
          />
          <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {loading ? (
          <Button className="w-full  bg-sky-blue hover:bg-sky-blue" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please Wait
          </Button>
        ) : (
          <Button
            type="submit"
            className="w-full  bg-sky-blue hover:bg-sky-blue text-white"
          >
            Reset Password
          </Button>
        )}

        <div className="text-center text-sm text-gray-600">
          Back to{" "}
          <Link
            to="/login"
            className="text-blue-500 font-medium hover:underline"
          >
            Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
