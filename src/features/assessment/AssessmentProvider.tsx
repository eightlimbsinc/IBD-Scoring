"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assessmentSchema, emptyAssessment, type Assessment, type AssessmentInput } from "@/clinical/assessment-schema";

/**
 * Holds the one open assessment in memory only (React state).
 * Never written to localStorage, IndexedDB, cookies or the service worker cache.
 */
interface Ctx {
  form: UseFormReturn<AssessmentInput, unknown, Assessment>;
  started: boolean;
  setStarted: (v: boolean) => void;
  completed: Assessment | null;
  setCompleted: (a: Assessment | null) => void;
  reset: () => void;
}

const AssessmentContext = createContext<Ctx | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const form = useForm<AssessmentInput, unknown, Assessment>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: emptyAssessment(),
    mode: "onTouched",
  });
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState<Assessment | null>(null);

  // Warn before the tab is closed or reloaded with an open assessment — nothing is stored.
  useEffect(() => {
    if (!started) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [started]);

  const reset = () => {
    form.reset(emptyAssessment());
    setStarted(false);
    setCompleted(null);
  };

  return (
    <AssessmentContext.Provider value={{ form, started, setStarted, completed, setCompleted, reset }}>
      <FormProvider {...form}>{children}</FormProvider>
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const c = useContext(AssessmentContext);
  if (!c) throw new Error("useAssessment outside provider");
  return c;
}
