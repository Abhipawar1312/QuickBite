import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, LockKeyholeIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState<string>("");
  const loading = false;
  return (
    <div className="flex justify-center items-center min-h-screen w-full">
      <form className="flex flex-col gap-5 md:p-8 w-full max-w-md rounded-lg mx-4">
        <div className="text-center">
          <h1 className="font-extrabold text-2xl mb-2">Reset Password</h1>
          <p className="text-sm text-gray-600">
            Enter Your New Password to Reset Old Password
          </p>
        </div>
        <div className="relative w-full">
          <Input
            type="password"
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Email Your New Password"
            className="pl-10"
            value={newPassword}
          />
          <LockKeyholeIcon className="absolute inset-y-2 left-2 text-gray-600 pointer-events-none" />
        </div>
        {loading ? (
          <Button className="bg-sky-blue hover:bg-sky-blue" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please Wait
          </Button>
        ) : (
          <Button className="bg-sky-blue hover:bg-sky-blue">Reset</Button>
        )}
        <span className="text-center">
          Back to
          <Link to="/login" className="text-blue-500">
            {" "}
            Login
          </Link>
        </span>
      </form>
    </div>
  );
};

export default ResetPassword;
