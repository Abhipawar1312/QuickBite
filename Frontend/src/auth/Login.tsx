import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { ChangeEvent, FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { LoginInputState, userLoginSchema } from "@/schema/userSchema";
import { useUserStore } from "@/store/useUserStore";

const Login = () => {
  const [input, setInput] = useState<LoginInputState>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<LoginInputState>>({});
  const [showPassword, setShowPassword] = useState(false);
  const { loading, login } = useUserStore();
  const navigate = useNavigate();

  const changeEventHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput({ ...input, [name]: value });

    const singleFieldSchema =
      userLoginSchema.shape[name as keyof LoginInputState];

    if (singleFieldSchema) {
      const result = singleFieldSchema.safeParse(value);

      setErrors((prevErrors) => ({
        ...prevErrors,
        [name as keyof LoginInputState]: result.success
          ? undefined
          : prevErrors[name as keyof LoginInputState],
      }));

      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: result.success ? undefined : result.error.issues[0].message,
      }));
    }
  };

  const loginSubmitHandler = async (e: FormEvent) => {
    e.preventDefault();
    const result = userLoginSchema.safeParse(input);
    if (!result.success) {
      const fieldErrors = result.error.formErrors.fieldErrors;
      setErrors(fieldErrors as Partial<LoginInputState>);
      return;
    }

    try {
      await login(input);
      navigate("/");
    } catch (error: any) {
      const message = error.message;
      if (message === "Incorrect email or password") {
        setErrors({ email: message, password: message });
      } else {
        console.error("Unexpected login error:", message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form
        onSubmit={loginSubmitHandler}
        className="w-full max-w-md bg-white border border-gray-200 shadow-md rounded-2xl p-8"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">QuickBite</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, login to your account
          </p>
        </div>

        {/* Email */}
        <div className="mb-5">
          <div className="relative">
            <Input
              type="email"
              placeholder="Enter your email"
              name="email"
              value={input.email}
              onChange={changeEventHandler}
              className={`pl-10 ${errors?.email ? "border-red-500" : ""}`}
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          {errors?.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-5">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              name="password"
              value={input.password}
              onChange={changeEventHandler}
              className={`pl-10 pr-10 ${
                errors?.password ? "border-red-500" : ""
              }`}
            />
            <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors?.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
          )}
        </div>

        {/* Forgot password */}
        <div className="text-right mb-6">
          <Link
            to="/forgot-password"
            className="text-sm text-blue-500 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit button */}
        <div className="mb-6">
          {loading ? (
            <Button className="w-full bg-sky-blue hover:bg-sky-blue" disabled>
              <Loader2 className="animate-spin mr-2 h-4 w-4" /> Please wait
            </Button>
          ) : (
            <Button
              type="submit"
              className="w-full bg-sky-blue hover:bg-sky-blue text-white font-medium"
            >
              Login
            </Button>
          )}
        </div>

        <Separator />

        {/* Signup link */}
        <p className="text-center mt-4 text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-blue-600 font-medium hover:underline"
          >
            Signup
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
