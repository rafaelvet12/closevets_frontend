"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

export function useToast(duration = 4000) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const showToast = useCallback((message: string, type: ToastState["type"] = "success") => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setToast({ message, type });
    timeoutRef.current = window.setTimeout(() => setToast(null), duration);
  }, [duration]);

  const closeToast = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setToast(null);
  }, []);

  return { toast, showToast, closeToast };
}
