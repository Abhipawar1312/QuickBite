import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/useUserStore";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SetStateAction, useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";

const VerifyEmail = () => {
  const [otp, setOtp] = useState("");
  const { loading, verifyEmail } = useUserStore();
  const navigate = useNavigate();

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await verifyEmail(otp);
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md border border-gray-200 rounded-2xl shadow-md p-8 bg-white">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Verify Email</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        <form onSubmit={submitHandler} className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value: SetStateAction<string>) => setOtp(value)}
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              className="text-black"
            >
              <InputOTPGroup className="gap-2">
                {[...Array(6)].map((_, i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="w-10 h-12 bg-white border border-gray-300 text-black text-xl text-center rounded-md focus:outline-none focus:border-blue-500"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {loading ? (
            <Button
              disabled
              className="w-full text-white bg-sky-blue hover:bg-sky-blue"
            >
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Verifying...
            </Button>
          ) : (
            <Button
              type="submit"
              className="w-full text-white bg-sky-blue hover:bg-sky-blue"
            >
              Verify
            </Button>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Didn't receive the code?{" "}
          <button
            type="button"
            className="text-blue-600 font-medium hover:underline"
            onClick={() => alert("Resend OTP logic goes here")}
          >
            Resend
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
