"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyGuideRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/journey/missions#guide");
  }, [router]);
  return null;
}
