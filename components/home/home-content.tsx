"use client";

import { Header } from "./header";
import { HeroSection } from "./hero-section";
import { UserTypeCards } from "./user-type-cards";
import { HowItWorks } from "./how-it-works";
import { Footer } from "./footer";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function HomeContent() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex flex-col gap-[32px] items-center justify-center text-center w-full max-w-5xl mx-auto mt-16 py-5 px-8 sm:px-20 ">
        <HeroSection />

        <div className="mt-8 w-full">
          <UserTypeCards />
        </div>

        <div className="mt-12 mb-16">
          <HowItWorks />
        </div>
      </main>

      <div className="w-full mt-auto">
        <Footer />
      </div>
    </div>
  );
}
