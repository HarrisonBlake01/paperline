import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <SignUp
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
        appearance={{ variables: { colorPrimary: "#5B8DEF" } }}
      />
    </div>
  );
}
