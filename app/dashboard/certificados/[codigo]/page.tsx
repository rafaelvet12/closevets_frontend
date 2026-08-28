"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface CertificateValidation {
  uuid_code: string;
  status: string;
  snapshot_data: {
    aluno_nome: string;
    aluno_cpf: string;
    curso_nome: string;
    turma_codigo: string;
    carga_horaria: number;
    data_inicio: string;
    data_fim: string;
  };
  issued_at: string;
}

export default function ValidarCertificadoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const resolvedParams = use(params);
  const codigo = resolvedParams.codigo;

  const [certData, setCertData] = useState<CertificateValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function checkCertificate() {
      try {
        const res = await fetch(`http://https://closevets-backend.onrender.com:8000/certificados/validar/${codigo}`);
        if (res.ok) {
          const data = await res.json();
          setCertData(data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    checkCertificate();
  }, [codigo]);

  // Função para mascarar o CPF seguindo a regra: ..***-21
  const maskCPF = (cpf: string) => {
    if (!cpf || cpf.length < 3) return "..***-00";
    const clean = cpf.replace(/\D/g, "");
    const lastTwo = clean.slice(-2);
    return `..***-${lastTwo}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-body text-[#004aad]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#38b6ff] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-semibold">Validando autenticidade do certificado...</p>
        </div>
      </div>
    );
  }

  if (error || !certData) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-body">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4 border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl text-red-600 uppercase">Certificado Inválido</h1>
          <p className="text-slate-500 text-sm">Não encontramos nenhum registro oficial correspondente ao código informado: <span className="font-mono font-bold text-slate-700">{codigo}</span>.</p>
          <div className="pt-4">
            <Link href="/" className="inline-block bg-[#004aad] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-[#003882] transition-colors">
              Ir para o site da CloseVets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCancelled = certData.status === "cancelled" || certData.status === "CANCELADO";

  return (
    <main className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 flex flex-col items-center justify-center font-body">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Cabeçalho do Status */}
        <div className={`p-8 text-white text-center ${isCancelled ? "bg-red-600" : "bg-[#004aad]"}`}>
          <h2 className="font-heading text-3xl tracking-wider mb-1">CLOSEVETS</h2>
          <p className="text-xs uppercase tracking-widest text-[#38b6ff] font-semibold mb-6">Validação Oficial de Certificado</p>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${isCancelled ? "bg-white/20 text-white" : "bg-[#d4ed31] text-[#004aad]"}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isCancelled ? "bg-white" : "bg-green-600 animate-pulse"}`}></span>
            {isCancelled ? "Certificado Cancelado" : "Certificado Válido e Autêntico"}
          </div>
        </div>

        {/* Corpo dos Dados */}
        <div className="p-8 space-y-6 text-slate-700">
          <div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Estudante</span>
            <p className="text-2xl font-heading text-[#004aad] mt-0.5">{certData.snapshot_data.aluno_nome}</p>
            <p className="text-sm font-mono text-slate-500 mt-0.5">CPF: {maskCPF(certData.snapshot_data.aluno_cpf)}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Curso Concluído</span>
              <p className="font-bold text-slate-800 text-base mt-0.5">{certData.snapshot_data.curso_nome}</p>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Carga Horária Total</span>
              <p className="font-bold text-slate-800 text-base mt-0.5">{certData.snapshot_data.carga_horaria} horas</p>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Turma / Edição</span>
              <p className="font-bold text-slate-800 text-base mt-0.5">{certData.snapshot_data.turma_codigo}</p>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Data de Emissão</span>
              <p className="font-bold text-slate-800 text-base mt-0.5">{certData.issued_at ? new Date(certData.issued_at).toLocaleDateString('pt-BR') : "-"}</p>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Código de Autenticidade Único</p>
            <p className="font-mono text-sm font-bold text-slate-600 mt-1 bg-slate-100 py-1.5 px-4 rounded-lg inline-block">{certData.uuid_code}</p>
          </div>
        </div>

        {/* Rodapé */}
        <div className="bg-[#f8fafc] p-4 text-center border-t border-slate-100 text-xs text-slate-400">
          CloseVets Cursos Livres Veterinários • Sistema de Ensino Verificado
        </div>

      </div>
    </main>
  );
}