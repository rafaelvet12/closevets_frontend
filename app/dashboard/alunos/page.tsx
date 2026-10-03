"use client";

import { useState, useEffect } from "react";
import ConfirmDialog from "@/app/components/confirm-dialog";
import EmptyState from "@/app/components/empty-state";
import PageHeader from "@/app/components/page-header";
import Toast from "@/app/components/toast";
import { useToast } from "@/app/hooks/useToast";
import { errorMessage } from "@/app/lib/api";
import { formatCpf, formatCrmv, formatPhone } from "@/app/lib/format";
import { deactivateStudent, listStudentEnrollments, listStudents, saveStudent } from "@/app/services/closevets";
import type { Student, StudentEnrollment } from "@/app/types/domain";

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast, showToast, closeToast } = useToast();
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; onConfirm: () => void; title: string } | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [phone, setPhone] = useState("");
  const [profession, setProfession] = useState("Médico Veterinário");
  const [crmv, setCrmv] = useState("");
  const [origin, setOrigin] = useState("Instagram");

  const fetchAlunos = async () => {
    try {
      setAlunos(await listStudents());
    } catch (error) {
      showToast(errorMessage(error, "Erro ao carregar alunos."), "error");
    }
  };

  useEffect(() => { fetchAlunos(); }, []);

  const openDetails = async (student: Student) => {
    setSelectedStudent(student);
    setIsDetailsOpen(true);
    try {
      setEnrollments(await listStudentEnrollments(student.id));
    } catch (error) {
      showToast(errorMessage(error, "Erro ao carregar o histórico."), "error");
    }
  };

  const handleOpenCreateModal = () => { 
    setIsEditMode(false); setName(""); setEmail(""); setCpf(""); setRg(""); setPhone(""); 
    setProfession("Médico Veterinário"); setCrmv(""); setOrigin("Instagram");
    setIsModalOpen(true); 
  };
  
  const handleOpenEditModal = (student: Student) => { 
    setIsEditMode(true); setSelectedStudent(student); 
    setName(student.name); setEmail(student.email); setCpf(formatCpf(student.cpf)); setRg(student.rg || ""); setPhone(student.phone || ""); 
    setProfession(student.profession || "Médico Veterinário"); setCrmv(formatCrmv(student.crmv || ""));
    setOrigin(student.notes?.replace("Origem: ", "") || "Instagram");
    setIsDetailsOpen(false); setIsModalOpen(true); 
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanCpf = cpf.replace(/\D/g, "");
    try {
      await saveStudent(isEditMode ? selectedStudent?.id : undefined, {
        name, email, cpf: cleanCpf, rg, phone, profession, crmv, notes: `Origem: ${origin}`,
      });
      setIsModalOpen(false);
      fetchAlunos();
      showToast(isEditMode ? "Aluno atualizado com sucesso!" : "Aluno cadastrado com sucesso!");
    } catch (error) {
      showToast(errorMessage(error, "Erro de conexão."), "error");
    } finally { setLoading(false); }
  };

  const handleDeactivate = (student: Student) => {
    setConfirmModal({
      show: true, 
      title: `Deseja desativar o aluno ${student.name}?`,
      onConfirm: async () => {
        try {
          await deactivateStudent(student.id);
          setIsDetailsOpen(false);
          setConfirmModal(null);
          fetchAlunos();
          showToast("Aluno desativado com sucesso.");
        } catch (error) {
          showToast(errorMessage(error, "Erro de conexão."), "error");
        }
      }
    });
  };

  const filteredAlunos = alunos.filter((aluno) => aluno.name.toLowerCase().includes(searchTerm.toLowerCase()) || aluno.cpf.includes(searchTerm) || aluno.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <ConfirmDialog
        open={Boolean(confirmModal?.show)}
        title={confirmModal?.title || ""}
        description="Essa ação alterará o status do aluno no sistema."
        onCancel={() => setConfirmModal(null)}
        onConfirm={() => confirmModal?.onConfirm()}
      />

      <PageHeader
        title="Diretório de Alunos"
        description="Gerencie os dados cadastrais e o perfil dos estudantes (CRM)."
        search={searchTerm}
        searchPlaceholder="Buscar aluno, e-mail ou CPF..."
        onSearch={setSearchTerm}
        actionLabel="NOVO ALUNO"
        onAction={handleOpenCreateModal}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#f8fafc] grid grid-cols-6 p-4 border-b border-slate-100 font-body font-bold text-slate-500 text-sm uppercase">
          <div className="col-span-2">Nome</div>
          <div>CPF</div>
          <div className="col-span-2">Contato</div>
          <div className="text-right">Ações</div>
        </div>
        
        {filteredAlunos.length === 0 ? (
          <EmptyState message="Nenhum aluno encontrado." />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAlunos.map((aluno) => (
              <div key={aluno.id} className="grid grid-cols-6 p-4 items-center hover:bg-slate-50 font-body text-slate-700 transition-colors">
                <div className="col-span-2 font-bold text-[#004aad]">{aluno.name}
                  <span className="block text-xs text-slate-400 font-medium mt-0.5">{aluno.profession}</span>
                </div>
                <div className="text-slate-600 text-sm">{formatCpf(aluno.cpf)}</div>
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
                <div><label className="block text-sm font-semibold text-[#004aad] mb-1">CPF</label><input required value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} className="w-full px-4 py-3 rounded-lg border" placeholder="000.000.000-00" /></div>
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
                    onChange={e => setCrmv(formatCrmv(e.target.value))} 
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
                <div><span className="block text-xs font-semibold text-slate-400 uppercase">CPF</span><span className="text-slate-700 font-medium">{formatCpf(selectedStudent.cpf)}</span></div>
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