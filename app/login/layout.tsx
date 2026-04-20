import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | EzTread",
  description: "Sign in to your EzTread account to compare tire prices and find local shops.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
