"use client";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

const TONE: Record<NonNullable<ToastProps["type"]>, string> = {
  success: "bg-[#004aad] border border-[#38b6ff]",
  error: "bg-red-600",
  info: "bg-slate-800",
};

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[80]">
      <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 text-white font-body text-sm font-semibold ${TONE[type]}`}>
        <span>{message}</span>
        <button type="button" onClick={onClose} className="text-white/80 hover:text-white font-bold">
          &times;
        </button>
      </div>
    </div>
  );
}
