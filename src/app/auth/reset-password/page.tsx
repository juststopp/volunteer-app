import { PasswordResetForm } from "@/components/auth/reset-password-form";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense>
        <PasswordResetForm />
      </Suspense>
    </div>
  );
}
