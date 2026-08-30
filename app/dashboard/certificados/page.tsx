"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/app/config";

interface CertificateData {
  id: number;
  enrollment_id: number;
  uuid_code: string;
  status: string;
  issued_at: string;
  snapshot_data: {
    aluno_nome: string;
    curso_nome: string;
    turma_codigo: string;
    carga_horaria: number;
  };
}

export default function CertificadosPage() {
  const [certificados, setCertificados] = useState<CertificateData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matriculaId, setMatriculaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchCertificados = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/certificados/`);
      if (res.ok) setCertificados(await res.json());
    } catch (error) {
      console.error("Erro ao buscar certificados:", error);
    }
  };

  useEffect(() => { fetchCertificados(); }, []);

  const handleEmitir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matriculaId) return;

    setLoading(true);
    // Limpa qualquer prefixo (como MAT-) para enviar só o número
    const cleanId = matriculaId.replace(/\D/g, "");

    try {
      const res = await fetch(`${API_BASE_URL}/certificados/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollment_id: Number(cleanId) }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsModalOpen(false);
        setMatriculaId("");
        fetchCertificados();
        showToast(`Sucesso! Certificado ${data.uuid_code} emitido.`);
      } else {
        // Exibe a mensagem de bloqueio (se não estiver CONCLUIDO)
        showToast(data.detail || "Erro ao emitir certificado.", "error");
      }
    } catch (error) {
      showToast("Erro de conexão.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (uuid: string) => {
    window.open(`${API_BASE_URL}/certificados/${uuid}/download`, "_blank");
  };

  const filtered = certificados.filter(c => 
    c.uuid_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.snapshot_data.aluno_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {toast && (
        <div className="fixed bottom-6 right-6 z-[80]">
          <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 text-white font-body text-sm font-semibold ${toast.type === "success" ? "bg-[#004aad] border border-[#38b6ff]" : "bg-red-600"}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-white/80 hover:text-white font-bold text-lg">&times;</button>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-heading text-4xl text-[#004aad] uppercase">Módulo de Certificados</h1>
          <p className="font-body text-slate-500 mt-1">Emissão automática baseada em histórico congelado por Snapshot.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input type="text" placeholder="Buscar por código ou aluno..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-64 px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#38b6ff] text-slate-700 font-body text-sm shadow-sm" />
          <button onClick={() => setIsModalOpen(true)} className="bg-[#004aad] hover:bg-[#003882] text-white font-heading px-6 py-3 rounded-lg shadow-sm whitespace-nowrap">
            EMITIR CERTIFICADO
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#f8fafc] grid grid-cols-6 p-4 border-b border-slate-100 font-body font-bold text-slate-500 text-sm uppercase tracking-wider">
          <div className="col-span-2">Aluno / Curso</div>
          <div>Código Único</div>
          <div>Emissão</div>
          <div className="text-right col-span-2">Ações</div>
        </div>
        
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-body">Nenhum certificado emitido.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((cert) => (
              <div key={cert.id} className="grid grid-cols-6 p-4 items-center hover:bg-slate-50 transition-colors font-body text-slate-700">
                <div className="col-span-2 font-bold text-[#004aad]">
                  {cert.snapshot_data.aluno_nome}
                  <span className="block text-xs text-slate-500 font-medium mt-0.5">
                    {cert.snapshot_data.curso_nome} ({cert.snapshot_data.carga_horaria}h)
                  </span>
                </div>
                <div className="text-slate-600 font-mono text-sm">{cert.uuid_code}</div>
                <div className="text-sm">{new Date(cert.issued_at).toLocaleDateString('pt-BR')}</div>
                <div className="text-right col-span-2 flex items-center justify-end gap-3">
                  <button onClick={() => handleDownload(cert.uuid_code)} className="text-[#38b6ff] hover:text-[#004aad] font-bold text-sm transition-colors flex items-center gap-1">
                    Baixar PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
             <div className="bg-[#004aad] p-5 text-white flex justify-between items-center">
              <h2 className="font-heading text-xl uppercase">Nova Emissão</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEmitir} className="p-6 space-y-4 font-body">
              <div>
                <label className="block text-sm font-semibold text-[#004aad] mb-1">Número da Matrícula</label>
                <input 
                  type="text" 
                  required 
                  value={matriculaId} 
                  onChange={(e) => setMatriculaId(e.target.value)} 
                  placeholder="Ex: MAT-00015"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-slate-800 bg-white"
                />
                <p className="text-xs text-slate-400 mt-2 text-justify">
                  Insira o ID da matrícula. O sistema bloqueará automaticamente a emissão caso o status da matrícula não esteja marcado como "CONCLUÍDO".
                </p>
              </div>
              
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-lg text-sm">CANCELAR</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#004aad] hover:bg-[#003882] text-white font-bold py-3 rounded-lg text-sm transition-colors">
                  {loading ? "VALIDANDO..." : "EMITIR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}