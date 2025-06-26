import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SignupInputState, userSignupSchema } from "@/schema/userSchema";
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
import { ChangeEvent, FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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

      // setErrors((prevErrors) => ({
      //   ...prevErrors,
      //   [name]: result.success ? undefined : prevErrors[name],
      // }));

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-md bg-white border border-gray-200 shadow-md rounded-2xl p-8"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">QuickBite</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>

        {/* Full Name */}
        <div className="mb-5">
          <div className="relative">
            <Input
              type="text"
              name="fullname"
              value={input.fullname}
              onChange={onChangeHandler}
              placeholder="Full Name"
              className={`pl-10 text-gray-900 ${
                errors?.fullname ? "border-red-500" : ""
              }`}
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          {errors?.fullname && (
            <p className="mt-1 text-xs text-red-500">{errors.fullname}</p>
          )}
        </div>

        {/* Email */}
        <div className="mb-5">
          <div className="relative">
            <Input
              type="email"
              name="email"
              value={input.email}
              onChange={onChangeHandler}
              placeholder="Email"
              className={`pl-10 text-gray-900 ${
                errors?.email ? "border-red-500" : ""
              }`}
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
              name="password"
              value={input.password}
              onChange={onChangeHandler}
              placeholder="Password"
              className={`pl-10 pr-10 text-gray-900 ${
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

        {/* Contact Number */}
        <div className="mb-6">
          <div className="relative">
            <Input
              type="number"
              name="contact"
              value={input.contact}
              onChange={onChangeHandler}
              placeholder="Contact Number"
              className={`pl-10 text-gray-900 ${
                errors?.contact ? "border-red-500" : ""
              }`}
            />
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          {errors?.contact && (
            <p className="mt-1 text-xs text-red-500">{errors.contact}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="mb-6">
          {loading ? (
            <Button className="w-full bg-sky-blue hover:bg-sky-blue" disabled>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Signing up...
            </Button>
          ) : (
            <Button
              type="submit"
              className="w-full bg-sky-blue hover:bg-sky-blue text-white"
            >
              Sign Up
            </Button>
          )}
        </div>

        <Separator />

        <p className="text-center mt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-medium hover:underline"
          >
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default SignUp;
