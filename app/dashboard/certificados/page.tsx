"use client";

import { useState, useEffect } from "react";

interface CertificateItem {
  id: number;
  uuid_code: string;
  enrollment_id: number;
  snapshot_data: {
    aluno_nome: string;
    curso_nome: string;
    turma_codigo: string;
    carga_horaria: number;
  };
  status: string;
  issued_at: string;
}

interface EnrollmentOption {
  id: number;
  student_name: string;
  course_name: string;
}

export default function CertificadosPage() {
  const [certificados, setCertificados] = useState<CertificateItem[]>([]);
  const [matriculas, setMatriculas] = useState<EnrollmentOption[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const resMat = await fetch("http://https://closevets-backend.onrender.com:8000/matriculas/");
      if (resMat.ok) {
        await resMat.json();
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollmentId) return;
    setLoading(true);

    try {
      const res = await fetch("http://https://closevets-backend.onrender.com:8000/certificados/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollment_id: Number(selectedEnrollmentId) }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        showToast(`Certificado emitido com sucesso! Código: ${data.uuid_code}`);
        setSelectedEnrollmentId("");
      } else {
        showToast(data.detail || "Erro ao emitir certificado.", "error");
      }
    } catch {
      showToast("Erro de conexão.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {toast && (
        <div className="fixed bottom-6 right-6 z-[80]">
          <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 text-white font-body text-sm font-semibold ${toast.type === "success" ? "bg-[#004aad] border border-[#38b6ff]" : "bg-red-600"}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-white/80 hover:text-white font-bold">&times;</button>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-heading text-4xl text-[#004aad] uppercase">Módulo de Certificados</h1>
          <p className="font-body text-slate-500 mt-1">Emissão automática baseada em histórico congelado por Snapshot.</p>
        </div>
        
        {/* Container fixo para evitar expansão infinita */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-full md:w-64 flex-shrink-0">
            <input 
              type="text" 
              placeholder="Buscar por código ou aluno..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#38b6ff] text-slate-700 font-body text-sm shadow-sm" 
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-[#004aad] hover:bg-[#003882] text-[#d4ed31] font-heading px-6 py-3 rounded-lg shadow-sm whitespace-nowrap transition-colors flex-shrink-0"
          >
            EMITIR CERTIFICADO
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-[#38b6ff]/10 text-[#004aad] rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="font-heading text-xl text-[#004aad]">Painel de Emissão Pronto</h3>
          <p className="font-body text-sm text-slate-500">
            O backend protege o histórico contra alterações e gera os arquivos em PDF dinamicamente. Clique em &quot;Emitir Certificado&quot; para iniciar uma nova emissão por matrícula.
          </p>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#004aad] p-6 text-white flex justify-between items-center">
              <h2 className="font-heading text-2xl uppercase">Emitir Certificado</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleIssueCertificate} className="p-6 space-y-4 font-body">
              <div>
                <label className="block text-sm font-semibold text-[#004aad] mb-1">ID da Matrícula Concluída</label>
                <input 
                  type="number" 
                  required 
                  value={selectedEnrollmentId} 
                  onChange={e => setSelectedEnrollmentId(e.target.value)} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-slate-800" 
                  placeholder="Ex: 1" 
                />
                <p className="text-xs text-slate-400 mt-1">Informe o ID da matrícula ativa do aluno na turma desejada.</p>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 font-bold py-3 rounded-lg text-sm">CANCELAR</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#d4ed31] text-[#004aad] font-bold py-3 rounded-lg text-sm uppercase disabled:opacity-50">
                  {loading ? "GERANDO..." : "GERAR PDF"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}