"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/app/config";

// --- FUNÇÕES DE MÁSCARA ---
const handleMaskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
};

const handleMaskCurrency = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const num = (parseInt(digits, 10) / 100).toFixed(2);
  return num.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const handleMaskPhone = (value: string) => {
  return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").replace(/(-\d{4})\d+?$/, "$1");
};
// --------------------------

interface Instructor {
  id: number;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  specialty: string;
  pix_key: string;
  hourly_rate: number;
}

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

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProfessores = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/professores/`);
      if (res.ok) setProfessores(await res.json());
    } catch (error) { console.error(error); }
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
    setCpf(prof.cpf ? handleMaskCPF(prof.cpf) : ""); 
    setEmail(prof.email || ""); 
    setPhone(prof.phone ? handleMaskPhone(prof.phone) : ""); 
    setSpecialty(prof.specialty || ""); 
    setPix(prof.pix_key || "");
    setRate(prof.hourly_rate ? prof.hourly_rate.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const numericRate = rate ? Number(rate.replace(/\./g, "").replace(",", ".")) : 0.0;
    const cleanCpf = cpf.replace(/\D/g, '');

    try {
      const url = isEditMode ? `${API_BASE_URL}/professores/${selectedProfessor?.id}` : `${API_BASE_URL}/professores/`;
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            name, 
            cpf: cleanCpf, 
            email, 
            phone, 
            specialty, 
            pix_key: pix, 
            hourly_rate: numericRate 
        }),
      });

      if (res.ok) { 
        setIsModalOpen(false); 
        fetchProfessores(); 
        showToast(isEditMode ? "Professor atualizado com sucesso!" : "Professor cadastrado com sucesso!");
      } else {
        const data = await res.json();
        showToast(data.detail || "Erro ao salvar professor.", "error");
      }
    } catch { showToast("Erro de conexão.", "error"); } finally { setLoading(false); }
  };

  const handleDelete = (prof: Instructor) => {
    setConfirmModal({
      show: true, 
      title: `Deseja desativar o professor ${prof.name}?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/professores/${prof.id}`, { method: "DELETE" });
          if (res.ok) {
            setConfirmModal(null); fetchProfessores(); showToast("Professor desativado com sucesso.");
          } else { 
            const data = await res.json();
            showToast(data.detail || "Erro ao desativar professor.", "error"); 
          }
        } catch { showToast("Erro de conexão.", "error"); }
      }
    });
  };

  const filteredProfessores = professores.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.specialty && p.specialty.toLowerCase().includes(searchTerm.toLowerCase())));

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

      {confirmModal?.show && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[70] backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="font-heading text-xl text-[#004aad]">{confirmModal.title}</h3>
            <p className="font-body text-sm text-slate-500">Essa ação impedirá que ele seja alocado em novas turmas.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-body font-bold py-2.5 rounded-lg text-sm">Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-body font-bold py-2.5 rounded-lg text-sm">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-heading text-4xl text-[#004aad] uppercase">Corpo Docente</h1>
          <p className="font-body text-slate-500 mt-1">Cadastro de professores e valores hora/aula.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input type="text" placeholder="Buscar por nome ou especialidade..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-64 px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#38b6ff] text-slate-700 font-body text-sm shadow-sm" />
          <button onClick={handleOpenCreateModal} className="bg-[#004aad] hover:bg-[#003882] text-[#d4ed31] font-heading px-6 py-3 rounded-lg shadow-sm whitespace-nowrap">
            NOVO PROFESSOR
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#f8fafc] grid grid-cols-5 p-4 border-b border-slate-100 font-body font-bold text-slate-500 text-sm uppercase">
          <div className="col-span-2">Nome / Especialidade</div>
          <div>Chave Pix</div>
          <div>Valor Hora/Aula</div>
          <div className="text-right">Ações</div>
        </div>
        
        {filteredProfessores.length === 0 ? (
          <div className="p-12 text-center"><p className="font-body text-slate-500 font-medium">Nenhum professor cadastrado.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProfessores.map((prof) => (
              <div key={prof.id} className="grid grid-cols-5 p-4 items-center font-body text-slate-700 hover:bg-slate-50 transition-colors">
                <div className="col-span-2 font-bold text-[#004aad]">{prof.name}
                  <span className="block text-xs text-slate-400 font-medium">{prof.specialty || "Clínico Geral"}</span>
                </div>
                <div className="text-slate-600 text-sm">{prof.pix_key || "Não cadastrada"}</div>
                <div className="font-bold text-green-600 text-sm">R$ {(prof.hourly_rate || 0).toLocaleString("pt-BR", {minimumFractionDigits: 2})}</div>
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
                  <input required placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(handleMaskCPF(e.target.value))} className="w-full px-4 py-3 rounded-lg border border-gray-200" />
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
                  <input value={phone} onChange={e => setPhone(handleMaskPhone(e.target.value))} className="w-full px-4 py-3 rounded-lg border border-gray-200" placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#004aad] mb-1">Chave Pix</label>
                  <input value={pix} placeholder="E-mail, CPF ou Telefone" onChange={e => setPix(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#004aad] mb-1">Valor Hora (R$)</label>
                  <input required value={rate} onChange={e => setRate(handleMaskCurrency(e.target.value))} placeholder="0,00" className="w-full px-4 py-3 rounded-lg border border-gray-200" />
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