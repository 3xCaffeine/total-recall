import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Header, HeroSection, Footer } from "@/components/landing";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header/>
      <main className="flex flex-1 flex-col">
        <HeroSection />
      </main>
      <Footer />
    </div>
  );
}
