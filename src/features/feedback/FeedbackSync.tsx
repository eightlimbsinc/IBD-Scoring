"use client";

import { useEffect } from "react";
import { sendPending } from "./store";
import { SPEC_VERSION } from "@/clinical/spec/version";

/** Retries unsent reviewer comments on app start and whenever the phone comes back online. */
export function FeedbackSync() {
  useEffect(() => {
    const run = () => void sendPending(SPEC_VERSION);
    run();
    window.addEventListener("online", run);
    return () => window.removeEventListener("online", run);
  }, []);
  return null;
}
