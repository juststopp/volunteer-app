import { SignUpForm } from "@/components/auth/signup-form";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #E0F6F7 0%, #b3eae9 100%)" }}>
      <SignUpForm />
    </div>
  );
}
