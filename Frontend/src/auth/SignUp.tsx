import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SignupInputState, userSignupSchema } from "@/schema/userSchema";
import { useUserStore } from "@/store/useUserStore";
import { Loader2, LockKeyhole, Mail, Phone, User } from "lucide-react";
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
  const { signup, loading } = useUserStore();
  const onChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput({ ...input, [name]: value });
  };
  const navigate = useNavigate();
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
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form
        onSubmit={onSubmitHandler}
        className="md:p-8 w-full max-w-md rounded-lg md:border border-gray-200 mx-4"
      >
        <div className="mb-4">
          <h1 className="font-bold text-2xl">QuickBite</h1>
        </div>
        <div className="mb-4">
          <div className="relative">
            <Input
              type="text"
              value={input.fullname}
              onChange={onChangeHandler}
              name="fullname"
              placeholder="fullname"
              className="pl-10 focus-visible:ring-1"
            />
            <User className="absolute inset-y-2 left-2 text-gray-500 pointer-events-none" />
            {errors && (
              <span className="text-xs text-red-500">{errors.fullname}</span>
            )}
          </div>
        </div>
        <div className="mb-4">
          <div className="relative">
            <Input
              type="email"
              value={input.email}
              onChange={onChangeHandler}
              name="email"
              placeholder="Email"
              className="pl-10 focus-visible:ring-1"
            />
            <Mail className="absolute inset-y-2 left-2 text-gray-500 pointer-events-none" />
            {errors && (
              <span className="text-xs text-red-500">{errors.email}</span>
            )}
          </div>
        </div>
        <div className="mb-4">
          <div className="relative">
            <Input
              type="password"
              value={input.password}
              onChange={onChangeHandler}
              name="password"
              placeholder="Password"
              className="pl-10 focus-visible:ring-1"
            />
            <LockKeyhole className="absolute inset-y-2 left-2 text-gray-500 pointer-events-none" />
            {errors && (
              <span className="text-xs text-red-500">{errors.password}</span>
            )}
          </div>
        </div>
        <div className="mb-4">
          <div className="relative">
            <Input
              type="text"
              value={input.contact}
              onChange={onChangeHandler}
              name="contact"
              placeholder="Contact"
              className="pl-10 focus-visible:ring-1"
            />
            <Phone className="absolute inset-y-2 left-2 text-gray-500 pointer-events-none" />
            {errors && (
              <span className="text-xs text-red-500">{errors.contact}</span>
            )}
          </div>
        </div>
        <div className="mb-10">
          {loading ? (
            <Button className="w-full bg-sky-blue hover:bg-sky-blue">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Please Wait
            </Button>
          ) : (
            <Button
              type="submit"
              className="w-full bg-sky-blue hover:bg-sky-blue"
            >
              Sign Up
            </Button>
          )}
        </div>
        <Separator />
        <p className="mt-2">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500">
            Login{" "}
          </Link>
        </p>
      </form>
    </div>
  );
};

export default SignUp;
