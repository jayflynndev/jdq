"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { BrandButton } from "@/components/ui/BrandButton";

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900 px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We’ve sent you a confirmation link. Please click it to finish
            signing up.
          </CardDescription>
        </CardHeader>
        <div className="p-6 space-y-4">
          <p className="text-sm text-textc-muted">
            Didn’t get the email? Check your spam folder, or request a new link.
          </p>
          <Link href="/auth">
            <BrandButton variant="outline" className="w-full">
              Back to Sign In
            </BrandButton>
          </Link>
        </div>
      </Card>
    </div>
  );
}
