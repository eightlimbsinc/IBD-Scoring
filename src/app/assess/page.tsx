import { Suspense } from "react";
import { Wizard } from "@/features/assessment/Wizard";

export default function AssessPage() {
  return (
    <Suspense>
      <Wizard />
    </Suspense>
  );
}
