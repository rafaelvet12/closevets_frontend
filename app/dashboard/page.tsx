"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/app/config";

interface DashboardStats {
  totalAlunos: number;
  totalTurmas: number;
  totalMatriculas: number;
  receitaPrevista: number;
}

interface RecentEnrollment {
  id: number;
  student_name: string;
  course_name: string;
  status: string;
  enrollment_date: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAlunos: 0,
    totalTurmas: 0,
    totalMatriculas: 0,
    receitaPrevista: 0,
  });
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [resAlunos, resTurmas, resMatriculas] = await Promise.all([
          fetch(`${API_BASE_URL}/alunos/`),
          fetch(`${API_BASE_URL}/turmas/`),
          fetch(`${API_BASE_URL}/matriculas/`)
        ]);

        const alunos = resAlunos.ok ? await resAlunos.json() : [];
        const turmas = resTurmas.ok ? await resTurmas.json() : [];
        const matriculas = resMatriculas.ok ? await resMatriculas.json() : [];

        const receita = matriculas.reduce((acc: number, mat: any) => acc + (mat.final_price || 0), 0);

        setStats({
          totalAlunos: alunos.length,
          totalTurmas: turmas.length,
          totalMatriculas: matriculas.length,
          receitaPrevista: receita,
        });

        // Pega as 5 matrículas mais recentes para a tabela de resumo
        setRecentEnrollments(matriculas.slice(-5).reverse());
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#38b6ff] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-heading text-[#004aad] text-xl">Carregando indicadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-heading text-4xl text-[#004aad] uppercase">Visão Geral</h1>
          <p className="font-body text-slate-500 mt-1">Bem-vindo de volta, Rafael. Aqui está o resumo da sua operação.</p>
        </div>
      </div>

      {/* CARDS DE INDICADORES (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow cursor-default">
          <div className="w-14 h-14 rounded-full bg-[#38b6ff]/10 flex items-center justify-center text-[#38b6ff]">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div>
            <p className="font-body text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">Total de Alunos</p>
            <h3 className="font-heading text-3xl text-[#004aad]">{stats.totalAlunos}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow cursor-default">
          <div className="w-14 h-14 rounded-full bg-[#d4ed31]/20 flex items-center justify-center text-[#9cae1c]">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div>
            <p className="font-body text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">Turmas Ativas</p>
            <h3 className="font-heading text-3xl text-[#004aad]">{stats.totalTurmas}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow cursor-default">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <p className="font-body text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">Matrículas</p>
            <h3 className="font-heading text-3xl text-[#004aad]">{stats.totalMatriculas}</h3>
          </div>
        </div>

        <div className="bg-[#004aad] p-6 rounded-2xl shadow-md flex items-center gap-5 cursor-default relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-[#d4ed31] z-10">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="z-10">
            <p className="font-body text-sm text-[#38b6ff] font-semibold uppercase tracking-wider mb-1">Receita Prevista</p>
            <h3 className="font-heading text-3xl text-white">R$ {stats.receitaPrevista.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* SESSÃO DE ÚLTIMAS MATRÍCULAS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#f8fafc] p-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-heading text-xl text-[#004aad]">Últimas Matrículas</h2>
        </div>
        
        {recentEnrollments.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-body text-slate-500 font-medium">Ainda não há matrículas registradas recentes.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentEnrollments.map((mat) => (
              <div key={mat.id} className="grid grid-cols-4 p-5 items-center hover:bg-slate-50 transition-colors font-body text-slate-700">
                <div className="col-span-2 font-bold text-[#004aad]">{mat.student_name}
                  <span className="block text-xs text-slate-400 font-medium mt-0.5">Turma: {mat.course_name}</span>
                </div>
                <div className="text-slate-500 text-sm">Data: {mat.enrollment_date}</div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold uppercase">{mat.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}