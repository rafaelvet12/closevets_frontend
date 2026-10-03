"use client";

import { useState, useEffect } from "react";
import ConfirmDialog from "@/app/components/confirm-dialog";
import EmptyState from "@/app/components/empty-state";
import PageHeader from "@/app/components/page-header";
import Toast from "@/app/components/toast";
import { useToast } from "@/app/hooks/useToast";
import { errorMessage } from "@/app/lib/api";
import { formatCpf, formatMoney, formatPhone, maskCurrency, parseCurrency } from "@/app/lib/format";
import { deactivateInstructor, listInstructors, saveInstructor } from "@/app/services/closevets";
import type { Instructor } from "@/app/types/domain";

export default function ProfessoresPage() {
  const [professores, setProfessores] = useState<Instructor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<Instructor | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; onConfirm: () => void; title: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [pix, setPix] = useState("");
  const [rate, setRate] = useState("");

  const { toast, showToast, closeToast } = useToast();

  const fetchProfessores = async () => {
    try {
      setProfessores(await listInstructors());
    } catch (error) {
      showToast(errorMessage(error, "Erro ao carregar professores."), "error");
    }
  };

  useEffect(() => { fetchProfessores(); }, []);

  const handleOpenCreateModal = () => {
    setIsEditMode(false); setSelectedProfessor(null);
    setName(""); setCpf(""); setEmail(""); setPhone(""); setSpecialty(""); setPix(""); setRate("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prof: Instructor) => {
    setIsEditMode(true); setSelectedProfessor(prof);
    setName(prof.name); 
    setCpf(prof.cpf ? formatCpf(prof.cpf).slice(0, 14) : ""); 
    setEmail(prof.email || ""); 
    setPhone(prof.phone ? formatPhone(prof.phone) : ""); 
    setSpecialty(prof.specialty || ""); 
    setPix(prof.pix_key || "");
    setRate(prof.hourly_rate ? prof.hourly_rate.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const numericRate = parseCurrency(rate);
    const cleanCpf = cpf.replace(/\D/g, '');

    try {
      await saveInstructor(isEditMode ? selectedProfessor?.id : undefined, {
        name,
        cpf: cleanCpf,
        email,
        phone,
        specialty,
        pix_key: pix,
        hourly_rate: numericRate,
      });
      setIsModalOpen(false);
      fetchProfessores();
      showToast(isEditMode ? "Professor atualizado com sucesso!" : "Professor cadastrado com sucesso!");
    } catch (error) {
      showToast(errorMessage(error, "Erro de conexão."), "error");
    } finally { setLoading(false); }
  };

  const handleDelete = (prof: Instructor) => {
    setConfirmModal({
      show: true, 
      title: `Deseja desativar o professor ${prof.name}?`,
      onConfirm: async () => {
        try {
          await deactivateInstructor(prof.id);
          setConfirmModal(null);
          fetchProfessores();
          showToast("Professor desativado com sucesso.");
        } catch (error) {
          showToast(errorMessage(error, "Erro de conexão."), "error");
        }
      }
    });
  };

  const filteredProfessores = professores.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.specialty && p.specialty.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <ConfirmDialog
        open={Boolean(confirmModal?.show)}
        title={confirmModal?.title || ""}
        description="Essa ação impedirá que ele seja alocado em novas turmas."
        onCancel={() => setConfirmModal(null)}
        onConfirm={() => confirmModal?.onConfirm()}
      />

      <PageHeader
        title="Corpo Docente"
        description="Cadastro de professores e valores hora/aula."
        search={searchTerm}
        searchPlaceholder="Buscar por nome ou especialidade..."
        onSearch={setSearchTerm}
        actionLabel="NOVO PROFESSOR"
        onAction={handleOpenCreateModal}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#f8fafc] grid grid-cols-5 p-4 border-b border-slate-100 font-body font-bold text-slate-500 text-sm uppercase">
          <div className="col-span-2">Nome / Especialidade</div>
          <div>Chave Pix</div>
          <div>Valor Hora/Aula</div>
          <div className="text-right">Ações</div>
        </div>
        
        {filteredProfessores.length === 0 ? (
          <EmptyState message="Nenhum professor cadastrado." />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProfessores.map((prof) => (
              <div key={prof.id} className="grid grid-cols-5 p-4 items-center font-body text-slate-700 hover:bg-slate-50 transition-colors">
                <div className="col-span-2 font-bold text-[#004aad]">{prof.name}
                  <span className="block text-xs text-slate-400 font-medium">{prof.specialty || "Clínico Geral"}</span>
                </div>
                <div className="text-slate-600 text-sm">{prof.pix_key || "Não cadastrada"}</div>
                <div className="font-bold text-green-600 text-sm">R$ {formatMoney(prof.hourly_rate || 0)}</div>
                <div className="text-right flex items-center justify-end gap-3">
                  <button onClick={() => handleOpenEditModal(prof)} className="text-[#38b6ff] hover:text-[#004aad] font-semibold text-sm transition-colors">Editar</button>
                  <button onClick={() => handleDelete(prof)} className="text-slate-400 hover:text-red-600 font-semibold text-sm transition-colors">Desativar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-[#004aad] p-6 text-white flex justify-between items-center">
              <h2 className="font-heading text-2xl uppercase">{isEditMode ? "Editar Professor" : "Cadastrar Professor"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 font-body">
              <div>
                <label className="block text-sm font-semibold text-[#004aad] mb-1">Nome Completo</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200" placeholder="Ex: Diego" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#004aad] mb-1">CPF</label>
                  <input required placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(formatCpf(e.target.value).slice(0, 14))} className="w-full px-4 py-3 rounded-lg border border-gray-200" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#004aad] mb-1">Especialidade</label>
                  <input required value={specialty} onChange={e => setSpecialty(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200" placeholder="Ex: Direito Veterinário" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#004aad] mb-1">E-mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200" placeholder="professor@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#004aad] mb-1">Telefone / WhatsApp</label>
                  <input value={phone} onChange={e => setPhone(formatPhone(e.target.value))} className="w-full px-4 py-3 rounded-lg border border-gray-200" placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#004aad] mb-1">Chave Pix</label>
                  <input value={pix} placeholder="E-mail, CPF ou Telefone" onChange={e => setPix(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#004aad] mb-1">Valor Hora (R$)</label>
                  <input required value={rate} onChange={e => setRate(maskCurrency(e.target.value))} placeholder="0,00" className="w-full px-4 py-3 rounded-lg border border-gray-200" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 font-bold py-3 rounded-lg">CANCELAR</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#d4ed31] text-[#004aad] font-bold py-3 rounded-lg disabled:opacity-50">
                  {loading ? "SALVANDO..." : "SALVAR PROFESSOR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}