"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/app/config";

interface Student {
  id: number;
  name: string;
  email: string;
  cpf: string;
  rg?: string;
  phone?: string;
  profession?: string;
  crmv?: string;
  notes?: string;
}

interface Enrollment {
  id: number;
  course_name: string;
  enrollment_date: string;
  status: string;
}

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; onConfirm: () => void; title: string } | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [phone, setPhone] = useState("");
  const [profession, setProfession] = useState("Médico Veterinário");
  const [crmv, setCrmv] = useState("");
  const [origin, setOrigin] = useState("Instagram");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formatCPF = (value: string) => value.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})/, "$1-$2").replace(/(-\d{2})\d+?$/, "$1");
  const formatPhone = (value: string) => value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").replace(/(-\d{4})\d+?$/, "$1");
  
  const formatCRMV = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^0-9A-Z]/g, "");
    const match = cleaned.match(/^(\d{0,2})(\d{0,3})([A-Z]{0,2})/);
    if (!match) return cleaned;
    let result = match[1];
    if (match[2]) result += "." + match[2];
    if (match[3]) result += "-" + match[3];
    return result;
  };

  const fetchAlunos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/alunos/`);
      if (res.ok) setAlunos(await res.json());
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchAlunos(); }, []);

  const openDetails = async (student: Student) => {
    setSelectedStudent(student);
    setIsDetailsOpen(true);
    try {
      const res = await fetch(`${API_BASE_URL}/matriculas/aluno/${student.id}`);
      if (res.ok) setEnrollments(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleOpenCreateModal = () => { 
    setIsEditMode(false); setName(""); setEmail(""); setCpf(""); setRg(""); setPhone(""); 
    setProfession("Médico Veterinário"); setCrmv(""); setOrigin("Instagram");
    setIsModalOpen(true); 
  };
  
  const handleOpenEditModal = (student: Student) => { 
    setIsEditMode(true); setSelectedStudent(student); 
    setName(student.name); setEmail(student.email); setCpf(formatCPF(student.cpf)); setRg(student.rg || ""); setPhone(student.phone || ""); 
    setProfession(student.profession || "Médico Veterinário"); setCrmv(formatCRMV(student.crmv || ""));
    setOrigin(student.notes?.replace("Origem: ", "") || "Instagram");
    setIsDetailsOpen(false); setIsModalOpen(true); 
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanCpf = cpf.replace(/\D/g, "");
    try {
      const url = isEditMode ? `${API_BASE_URL}/alunos/${selectedStudent?.id}` : `${API_BASE_URL}/alunos/`;
      const method = isEditMode ? "PUT" : "POST";
      const res = await fetch(url, { 
        method: method, headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ name, email, cpf: cleanCpf, rg, phone, profession, crmv, notes: `Origem: ${origin}` }) 
      });
      
      if (res.ok) {
        setIsModalOpen(false); fetchAlunos(); showToast(isEditMode ? "Aluno atualizado com sucesso!" : "Aluno cadastrado com sucesso!");
      } else {
        const data = await res.json(); showToast(data.detail || "Erro ao salvar", "error");
      }
    } catch (error) { showToast("Erro de conexão.", "error"); } finally { setLoading(false); }
  };

  const handleDeactivate = (student: Student) => {
    setConfirmModal({
      show: true, 
      title: `Deseja desativar o aluno ${student.name}?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/alunos/${student.id}`, { method: "DELETE" });
          if (res.ok) { 
            setIsDetailsOpen(false); 
            setConfirmModal(null); 
            fetchAlunos(); 
            showToast("Aluno desativado com sucesso."); 
          } else {
            showToast("Erro ao desativar aluno.", "error");
          }
        } catch { showToast("Erro de conexão.", "error"); }
      }
    });
  };

  const filteredAlunos = alunos.filter((aluno) => aluno.name.toLowerCase().includes(searchTerm.toLowerCase()) || aluno.cpf.includes(searchTerm) || aluno.email.toLowerCase().includes(searchTerm.toLowerCase()));

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
            <p className="font-body text-sm text-slate-500">Essa ação alterará o status do aluno no sistema.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-lg text-sm">Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-sm">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-heading text-4xl text-[#004aad] uppercase">Diretório de Alunos</h1>
          <p className="font-body text-slate-500 mt-1">Gerencie os dados cadastrais e o perfil dos estudantes (CRM).</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input type="text" placeholder="Buscar aluno, e-mail ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-64 px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#38b6ff] text-slate-700 font-body text-sm shadow-sm" />
          <button onClick={handleOpenCreateModal} className="bg-[#004aad] hover:bg-[#003882] text-[#d4ed31] font-heading px-6 py-3 rounded-lg shadow-sm whitespace-nowrap">
            NOVO ALUNO
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#f8fafc] grid grid-cols-6 p-4 border-b border-slate-100 font-body font-bold text-slate-500 text-sm uppercase">
          <div className="col-span-2">Nome</div>
          <div>CPF</div>
          <div className="col-span-2">Contato</div>
          <div className="text-right">Ações</div>
        </div>
        
        {filteredAlunos.length === 0 ? (
          <div className="p-12 text-center"><p className="font-body text-slate-500 font-medium">Nenhum aluno encontrado.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAlunos.map((aluno) => (
              <div key={aluno.id} className="grid grid-cols-6 p-4 items-center hover:bg-slate-50 font-body text-slate-700 transition-colors">
                <div className="col-span-2 font-bold text-[#004aad]">{aluno.name}
                  <span className="block text-xs text-slate-400 font-medium mt-0.5">{aluno.profession}</span>
                </div>
                <div className="text-slate-600 text-sm">{formatCPF(aluno.cpf)}</div>
                <div className="col-span-2 text-sm">
                  <div className="font-semibold text-slate-700">{aluno.phone || "S/ Número"}</div>
                  <div className="text-xs text-slate-500">{aluno.email}</div>
                </div>
                <div className="text-right flex items-center justify-end gap-3">
                  <button onClick={() => openDetails(aluno)} className="text-[#38b6ff] hover:text-[#004aad] font-semibold text-sm transition-colors">Detalhes</button>
                  <button onClick={() => handleDeactivate(aluno)} className="text-slate-400 hover:text-red-600 font-semibold text-sm transition-colors">Desativar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="bg-[#004aad] p-6 text-white flex justify-between items-center">
              <h2 className="font-heading text-2xl uppercase">{isEditMode ? "Editar Aluno" : "Cadastrar Novo Aluno"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 font-body">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-semibold text-[#004aad] mb-1">Nome Completo</label><input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-lg border" placeholder="João da Silva" /></div>
                <div><label className="block text-sm font-semibold text-[#004aad] mb-1">CPF</label><input required value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} className="w-full px-4 py-3 rounded-lg border" placeholder="000.000.000-00" /></div>
                <div><label className="block text-sm font-semibold text-[#004aad] mb-1">RG</label><input value={rg} onChange={e => setRg(e.target.value)} className="w-full px-4 py-3 rounded-lg border" placeholder="00.000.000-0" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-[#004aad] mb-1">WhatsApp</label><input value={phone} onChange={e => setPhone(formatPhone(e.target.value))} className="w-full px-4 py-3 rounded-lg border" placeholder="(00) 00000-0000" /></div>
                <div><label className="block text-sm font-semibold text-[#004aad] mb-1">E-mail</label><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-[#004aad] mb-1">Profissão</label><select value={profession} onChange={e => setProfession(e.target.value)} className="w-full px-4 py-3 rounded-lg border bg-white"><option>Médico Veterinário</option><option>Estudante de Med. Veterinária</option><option>Outro</option></select></div>
                <div>
                  <label className="block text-sm font-semibold text-[#004aad] mb-1">CRMV</label>
                  <input 
                    maxLength={10} 
                    value={crmv} 
                    onChange={e => setCrmv(formatCRMV(e.target.value))} 
                    className="w-full px-4 py-3 rounded-lg border uppercase" 
                    placeholder="Ex: 12.345-SP" 
                  />
                </div>
                <div className="col-span-2"><label className="block text-sm font-semibold text-[#004aad] mb-1">Origem do Aluno</label><select value={origin} onChange={e => setOrigin(e.target.value)} className="w-full px-4 py-3 rounded-lg border bg-white"><option>Instagram</option><option>Google</option><option>Indicação</option><option>WhatsApp</option><option>Aluno Antigo</option><option>Outro</option></select></div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 font-bold py-3 rounded-lg">CANCELAR</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#d4ed31] text-[#004aad] font-bold py-3 rounded-lg disabled:opacity-50">{loading ? "SALVANDO..." : "SALVAR ALUNO"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailsOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-[#004aad] p-6 text-white flex justify-between items-center">
              <div><span className="text-xs uppercase tracking-widest text-[#38b6ff] font-bold">Ficha do Estudante</span><h2 className="font-heading text-2xl">{selectedStudent.name}</h2></div>
              <button onClick={() => setIsDetailsOpen(false)} className="text-white/70 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-6 font-body">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="col-span-2"><span className="block text-xs font-semibold text-slate-400 uppercase">E-mail</span><span className="text-slate-700 font-medium break-all">{selectedStudent.email}</span></div>
                <div><span className="block text-xs font-semibold text-slate-400 uppercase">CPF</span><span className="text-slate-700 font-medium">{formatCPF(selectedStudent.cpf)}</span></div>
                <div><span className="block text-xs font-semibold text-slate-400 uppercase">RG</span><span className="text-slate-700 font-medium">{selectedStudent.rg || "Não informado"}</span></div>
                <div><span className="block text-xs font-semibold text-slate-400 uppercase">Telefone</span><span className="text-slate-700 font-medium">{selectedStudent.phone || "Não informado"}</span></div>
                <div><span className="block text-xs font-semibold text-slate-400 uppercase">{selectedStudent.profession || "Profissão"}</span><span className="text-[#004aad] font-bold block">{selectedStudent.crmv || "S/ Registro"}</span></div>
                <div className="col-span-2"><span className="block text-xs font-semibold text-slate-400 uppercase">Marketing</span><span className="text-slate-700 font-medium">{selectedStudent.notes || "S/ Origem"}</span></div>
              </div>
              <div>
                <h3 className="font-heading text-lg text-[#004aad] mb-3 border-b border-slate-100 pb-2">Histórico de Turmas</h3>
                {enrollments.length === 0 ? (
                  <p className="font-body text-sm text-slate-500 py-4 bg-slate-50 rounded-lg text-center">Nenhum contrato ativo.</p>
                ) : (
                  <div className="space-y-3 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {enrollments.map(enc => (
                      <div key={enc.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div><p className="font-bold text-[#004aad] text-sm">{enc.course_name}</p><p className="text-xs text-slate-400">Início: {enc.enrollment_date}</p></div>
                        <span className="px-2.5 py-1 bg-[#38b6ff]/10 text-[#004aad] rounded text-xs font-bold uppercase">{enc.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => handleDeactivate(selectedStudent)} className="bg-red-50 text-red-600 font-bold px-4 py-2.5 rounded-lg text-sm">DESATIVAR</button>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEditModal(selectedStudent)} className="bg-[#38b6ff]/10 text-[#004aad] font-bold px-4 py-2.5 rounded-lg text-sm">EDITAR DADOS</button>
                  <button onClick={() => setIsDetailsOpen(false)} className="bg-[#004aad] text-white font-bold px-5 py-2.5 rounded-lg text-sm">FECHAR</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}