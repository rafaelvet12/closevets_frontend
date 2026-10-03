"use client";

import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ title, onClose, children, maxWidth = "max-w-2xl" }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${maxWidth} overflow-hidden`}>
        <div className="bg-[#004aad] p-6 text-white flex justify-between items-center">
          <h2 className="font-heading text-2xl uppercase">{title}</h2>
          <button type="button" onClick={onClose} className="text-white/70 hover:text-white text-xl">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
