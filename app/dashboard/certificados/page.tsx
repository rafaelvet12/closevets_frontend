"use client";

import { useState, useEffect } from "react";
import EmptyState from "@/app/components/empty-state";
import Modal from "@/app/components/modal";
import PageHeader from "@/app/components/page-header";
import Toast from "@/app/components/toast";
import { useToast } from "@/app/hooks/useToast";
import { errorMessage } from "@/app/lib/api";
import { downloadCertificate, issueCertificate, listCertificates } from "@/app/services/closevets";
import type { Certificate } from "@/app/types/domain";

export default function CertificadosPage() {
  const [certificados, setCertificados] = useState<Certificate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matriculaId, setMatriculaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast, showToast, closeToast } = useToast(5000);

  const fetchCertificados = async () => {
    try {
      setCertificados(await listCertificates());
    } catch (error) {
      showToast(errorMessage(error, "Erro ao buscar certificados."), "error");
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
      const data = await issueCertificate(Number(cleanId));
      setIsModalOpen(false);
      setMatriculaId("");
      fetchCertificados();
      showToast(`Sucesso! Certificado ${data.uuid_code} emitido.`);
    } catch (error) {
      showToast(errorMessage(error, "Erro de conexão."), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (uuid: string) => {
    try {
      await downloadCertificate(uuid);
    } catch (error) {
      showToast(errorMessage(error, "Não foi possível baixar o certificado."), "error");
    }
  };

  const filtered = certificados.filter(c => 
    c.uuid_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.snapshot_data.aluno_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <PageHeader
        title="Módulo de Certificados"
        description="Emissão automática baseada em histórico congelado por Snapshot."
        search={searchTerm}
        searchPlaceholder="Buscar por código ou aluno..."
        onSearch={setSearchTerm}
        actionLabel="EMITIR CERTIFICADO"
        actionClassName="bg-[#004aad] hover:bg-[#003882] text-white font-heading px-6 py-3 rounded-lg shadow-sm whitespace-nowrap"
        onAction={() => setIsModalOpen(true)}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#f8fafc] grid grid-cols-6 p-4 border-b border-slate-100 font-body font-bold text-slate-500 text-sm uppercase tracking-wider">
          <div className="col-span-2">Aluno / Curso</div>
          <div>Código Único</div>
          <div>Emissão</div>
          <div className="text-right col-span-2">Ações</div>
        </div>
        
        {filtered.length === 0 ? (
          <EmptyState message="Nenhum certificado emitido." />
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
        <Modal title="Nova Emissão" onClose={() => setIsModalOpen(false)} maxWidth="max-w-sm">
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
        </Modal>
      )}
    </div>
  );
}