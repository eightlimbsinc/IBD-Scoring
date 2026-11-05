"use client";

import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export function ConnectionStatus() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold ${online ? "bg-lower-bg text-lower" : "bg-emergency-bg text-emergency"}`}
      role="status"
    >
      <span aria-hidden className={`h-2 w-2 rounded-full ${online ? "bg-lower" : "bg-emergency"}`} />
      {online ? "Online" : "Offline"}
    </span>
  );
}
