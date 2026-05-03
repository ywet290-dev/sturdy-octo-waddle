import { SignUp } from "@clerk/nextjs";

export default function SigninPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Create an Account</h1>
          <p className="text-zinc-500 mt-2">Join the community today</p>
        </div>
        <div className="flex justify-center">
          <SignUp routing="hash" />
        </div>
      </div>
    </div>
  );
}
