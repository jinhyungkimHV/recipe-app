"use client";

import { useEffect, useState } from "react";

export default function UpdateToast() {
  const [worker, setWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let refreshing = false;

    function onControllerChange() {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    }

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    void navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        if (registration.waiting) setWorker(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const nextWorker = registration.installing;
          nextWorker?.addEventListener("statechange", () => {
            if (
              nextWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWorker(nextWorker);
            }
          });
        });
      })
      .catch((error) =>
        console.error("Service worker registration failed:", error),
      );

    return () =>
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
  }, []);

  if (!worker) return null;

  return (
    <aside className="update-toast" role="status" aria-live="polite">
      <p>A new version is ready.</p>
      <div className="update-actions">
        <button
          id="refreshAppBtn"
          onClick={() => worker.postMessage({ type: "SKIP_WAITING" })}
        >
          Refresh
        </button>
        <button className="muted" onClick={() => setWorker(null)}>
          Later
        </button>
      </div>
    </aside>
  );
}
