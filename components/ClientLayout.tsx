"use client";

import { LocationProvider } from "@/contexts/LocationContext";
import type { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <LocationProvider>{children}</LocationProvider>;
}
