"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import BackNav from "@/components/BackNav";
import PageBackdrop from "@/components/PageBackdrop";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (user) {
    return (
      <main className="max-w-md mx-auto px-5 py-24 text-center">
        <Link href="/" className="block mb-8">
          <Logo />
        </Link>
        <p className="text-textDim mb-4">אתה כבר מחובר בתור {user.display_name}.</p>
        <Link href="/" className="text-moto font-bold hover:underline">
          למסך הראשי ←
        </Link>
      </main>
    );
  }

  return (
    <PageBackdrop>
      <main className="max-w-md mx-auto px-5 py-24">
        <div className="mb-4">
          <BackNav />
        </div>
        <Link href="/" className="block mb-8">
          <Logo />
        </Link>
        <AuthForm onSuccess={() => router.push("/")} />
      </main>
    </PageBackdrop>
  );
}
