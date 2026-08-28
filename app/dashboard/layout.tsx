"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("closevets_token");
    if (!token) {
      router.push("/");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("closevets_token");
    router.push("/");
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-[#004aad] font-heading text-2xl">Carregando...</div>;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      <aside className="w-64 bg-[#004aad] text-white flex flex-col shadow-xl">
        <div className="p-6 text-center border-b border-[#38b6ff]/30">
          <h2 className="font-heading text-3xl tracking-wider">CLOSEVETS</h2>
          <p className="font-body text-xs text-[#38b6ff] mt-1 uppercase tracking-widest">Painel de Controle</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 font-body text-sm font-semibold overflow-y-auto custom-scrollbar">
          <Link href="/dashboard" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard') ? 'bg-white/10 text-[#d4ed31]' : 'hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Visão Geral
          </Link>
          <Link href="/dashboard/dre" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard/dre') ? 'bg-white/10 text-[#d4ed31]' : 'hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Relatórios e DRE
          </Link>
          
          <div className="pt-4 pb-2">
            <p className="text-xs text-[#38b6ff] uppercase tracking-widest pl-4">Acadêmico</p>
          </div>
          
          <Link href="/dashboard/cursos" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard/cursos') ? 'bg-white/10 text-[#d4ed31]' : 'hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Catálogo de Cursos
          </Link>
          <Link href="/dashboard/turmas" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard/turmas') ? 'bg-white/10 text-[#d4ed31]' : 'hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            Gestão de Turmas
          </Link>
          <Link href="/dashboard/cronogramas" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard/cronogramas') ? 'bg-white/10 text-[#d4ed31]' : 'hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Cronogramas
          </Link>
          <Link href="/dashboard/professores" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard/professores') ? 'bg-white/10 text-[#d4ed31]' : 'hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
            Corpo Docente
          </Link>
          <Link href="/dashboard/alunos" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard/alunos') ? 'bg-white/10 text-[#d4ed31]' : 'hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Base de Alunos
          </Link>
          
          <div className="pt-4 pb-2">
            <p className="text-xs text-[#38b6ff] uppercase tracking-widest pl-4">Operacional</p>
          </div>

          <Link href="/dashboard/matriculas" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard/matriculas') ? 'bg-white/10 text-[#d4ed31]' : 'hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Matrículas
          </Link>
          <Link href="/dashboard/financeiro" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard/financeiro') ? 'bg-white/10 text-[#d4ed31]' : 'hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Caixa Financeiro
          </Link>
          <Link href="/dashboard/certificados" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard/certificados') ? 'bg-white/10 text-[#d4ed31]' : 'hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            Emitir Certificados
          </Link>
        </nav>

        <div className="p-4 border-t border-[#38b6ff]/30">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-body text-sm font-bold">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sair do Sistema
          </button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10 flex justify-end">
          <div className="bg-white px-5 py-2 rounded-full shadow-sm border border-slate-100 flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[#38b6ff] flex items-center justify-center text-white font-bold font-body">C</div>
             <span className="font-body text-sm font-semibold text-slate-700">Coordenação</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}