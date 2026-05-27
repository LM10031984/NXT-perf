"use client";

import { MicTestScreen } from "@/components/training/MicTestScreen";
import { useRouter } from "next/navigation";

export default function MicTestPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <MicTestScreen
          onConfirmed={() => {
            // En Phase 12, naviguera vers le scenario
            alert("Micro validé — route scenario à câbler en Phase 12");
          }}
          onBack={() => router.push("/conseiller/dashboard")}
        />
      </div>
    </div>
  );
}
