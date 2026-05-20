import { SignInForm } from "@/components/auth/signin-form";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #E0F6F7 0%, #b3eae9 100%)" }}>
      <SignInForm />
    </div>
  );
}
