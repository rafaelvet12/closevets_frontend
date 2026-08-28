"use client";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  const bgColors = {
    success: "bg-[#004aad] text-white border-[#38b6ff]",
    error: "bg-red-600 text-white border-red-400",
    info: "bg-slate-800 text-white border-slate-700"
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div className={`px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-4 ${bgColors[type]}`}>
        <span className="font-body text-sm font-semibold">{message}</span>
        <button onClick={onClose} className="text-white/80 hover:text-white font-bold text-lg">
          &times;
        </button>
      </div>
    </div>
  );
}