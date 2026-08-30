"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/app/config";

interface EnrollmentData {
  id: number;
  student_name: string;
  course_name: string;
  enrollment_date: string;
  status: string;
  payment_method: string;
  final_price: number;
}

interface OptionData {
  id: number;
  name?: string;
  internal_name?: string;
  price?: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmado: { label: "Ativo", color: "bg-green-100 text-green-700" },
  cursando: { label: "Cursando", color: "bg-green-100 text-green-700" },
  concluido: { label: "Concluído", color: "bg-blue-100 text-blue-700" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700" },
  desistente: { label: "Desistente", color: "bg-red-100 text-red-700" },
  interessado: { label: "Interessado", color: "bg-amber-100 text-amber-700" },
  pre_inscrito: { label: "Pré-inscrito", color: "bg-amber-100 text-amber-700" },
  inscrito: { label: "Inscrito", color: "bg-amber-100 text-amber-700" },
  matriculado: { label: "Matriculado", color: "bg-amber-100 text-amber-700" },
  pagamento_pendente: { label: "Pagamento pendente", color: "bg-amber-100 text-amber-700" },
  ATIVO: { label: "Ativo", color: "bg-green-100 text-green-700" },
  CANCELADO: { label: "Cancelado", color: "bg-red-100 text-red-700" },
  CONCLUIDO: { label: "Concluído", color: "bg-blue-100 text-blue-700" },
};

const getStatusDisplay = (status: string) =>
  STATUS_LABELS[status] || { label: status, color: "bg-slate-100 text-slate-700" };

const EDIT_STATUS_REVERSE_MAP: Record<string, string> = {
  confirmado: "ATIVO",
  cursando: "ATIVO",
  concluido: "CONCLUIDO",
  cancelado: "CANCELADO",
  ATIVO: "ATIVO",
  CANCELADO: "CANCELADO",
  CONCLUIDO: "CONCLUIDO",
};

export default function MatriculasPage() {
  const [matriculas, setMatriculas] = useState<EnrollmentData[]>([]);
  const [alunos, setAlunos] = useState<OptionData[]>([]);
  const [turmas, setTurmas] = useState<OptionData[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; onConfirm: () => void; title: string } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCohortId, setSelectedCohortId] = useState("");
  const [installments, setInstallments] = useState("1");
  
  const [selectedMatricula, setSelectedMatricula] = useState<EnrollmentData | null>(null);
  const [editStatus, setEditStatus] = useState("ATIVO");
  const [editPaymentMethod, setEditPaymentMethod] = useState("Pix");
  
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Formatador visual de ID para MAT-00000
  const formatMatriculaId = (id: number) => `MAT-${id.toString().padStart(5, "0")}`;

  const fetchData = async () => {
    try {
      const [resMatriculas, resAlunos, resTurmas] = await Promise.all([
        fetch(`${API_BASE_URL}/matriculas/`),
        fetch(`${API_BASE_URL}/alunos/`),
        fetch(`${API_BASE_URL}/turmas/`)
      ]);

      if (resMatriculas.ok) setMatriculas(await resMatriculas.json());
      if (resAlunos.ok) setAlunos(await resAlunos.json());
      if (resTurmas.ok) setTurmas(await resTurmas.json());
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCohortId || !selectedStudentId) return;
    
    const selectedTurma = turmas.find(t => t.id === Number(selectedCohortId));
    const fullPrice = selectedTurma?.price || 0.0;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/matriculas/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          student_id: Number(selectedStudentId), 
          cohort_id: Number(selectedCohortId),
          full_price: fullPrice,
          discount: 0.0,
          installments: Number(installments)
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsModalOpen(false); 
        setSelectedStudentId(""); 
        setSelectedCohortId(""); 
        setInstallments("1");
        fetchData();
        showToast("Matrícula realizada e cobranças geradas com sucesso!");
      } else {
        showToast(data.detail || "Erro ao matricular", "error");
      }
    } catch (error) { showToast("Erro de conexão.", "error"); } finally { setLoading(false); }
  };

  const handleOpenEdit = (mat: EnrollmentData) => {
    setSelectedMatricula(mat);
    setEditStatus(EDIT_STATUS_REVERSE_MAP[mat.status] || "ATIVO");
    setEditPaymentMethod(mat.payment_method || "Pix");
    setIsEditModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/matriculas/${selectedMatricula?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: editStatus,
          payment_method: editPaymentMethod 
        }),
      });
      
      if (res.ok) {
        setIsEditModalOpen(false); 
        fetchData(); 
        showToast("Matrícula atualizada com sucesso!");
      } else {
        showToast("Erro ao atualizar matrícula", "error");
      }
    } catch (error) { showToast("Erro de conexão.", "error"); } finally { setLoading(false); }
  };

  const handleCancelEnrollment = (mat: EnrollmentData) => {
    setConfirmModal({
      show: true,
      title: `Deseja cancelar a matrícula de ${mat.student_name}?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/matriculas/${mat.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              status: "CANCELADO",
              payment_method: mat.payment_method || "Pix"
            }),
          });

          if (res.ok) {
            setConfirmModal(null);
            fetchData();
            showToast("Matrícula cancelada com sucesso.");
          } else {
            showToast("Erro ao cancelar matrícula.", "error");
          }
        } catch {
          showToast("Erro de conexão.", "error");
        }
      }
    });
  };

  const filteredMatriculas = matriculas.filter(m => 
    m.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 right-6 z-[80]">
          <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 text-white font-body text-sm font-semibold ${toast.type === "success" ? "bg-[#004aad] border border-[#38b6ff]" : "bg-red-600"}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-white/80 hover:text-white font-bold text-lg">&times;</button>
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
            <p className="font-body text-sm text-slate-500">Essa ação alterará o status da matrícula para cancelado no sistema.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-lg text-sm">Voltar</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-sm">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-heading text-4xl text-[#004aad] uppercase">Gestão de Matrículas</h1>
          <p className="font-body text-slate-500 mt-1">Acompanhe contratos ativos, formas de pagamento e status.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input type="text" placeholder="Buscar aluno ou turma..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-4 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#38b6ff] text-slate-700 font-body text-sm shadow-sm" />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#004aad] hover:bg-[#003882] text-[#d4ed31] font-heading px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap">
            NOVA MATRÍCULA
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#f8fafc] grid grid-cols-6 p-4 border-b border-slate-100 font-body font-bold text-slate-500 text-sm uppercase tracking-wider">
          <div className="col-span-2">Aluno / Turma</div>
          <div>Pagamento</div>
          <div>Status</div>
          <div className="text-right col-span-2">Ações</div>
        </div>
        
        {filteredMatriculas.length === 0 ? (
          <div className="p-12 text-center"><p className="font-body text-slate-500 font-medium">Nenhuma matrícula registrada.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMatriculas.map((mat) => (
              <div key={mat.id} className="grid grid-cols-6 p-4 items-center hover:bg-slate-50 transition-colors font-body text-slate-700">
                <div className="col-span-2 font-bold text-[#004aad]">
                  {mat.student_name}
                  <span className="block text-xs text-slate-500 font-medium mt-0.5">
                    <strong className="text-[#38b6ff] mr-1">{formatMatriculaId(mat.id)}</strong> • {mat.course_name} (R$ {mat.final_price.toFixed(2)})
                  </span>
                </div>
                <div className="text-slate-600 font-semibold text-sm">{mat.payment_method}</div>
                <div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${getStatusDisplay(mat.status).color}`}>
                    {getStatusDisplay(mat.status).label}
                  </span>
                </div>
                <div className="text-right col-span-2 flex items-center justify-end gap-3">
                  <button onClick={() => handleOpenEdit(mat)} className="text-[#38b6ff] hover:text-[#004aad] font-semibold text-sm transition-colors">Gerenciar</button>
                  <button onClick={() => handleCancelEnrollment(mat)} className="text-slate-400 hover:text-red-600 font-semibold text-sm transition-colors">Cancelar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
             <div className="bg-[#004aad] p-5 text-white flex justify-between items-center">
              <h2 className="font-heading text-xl uppercase">Realizar Matrícula</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEnrollment} className="p-6 space-y-4 font-body">
              <div>
                <label className="block text-sm font-semibold text-[#004aad] mb-1">Selecione o Aluno(a):</label>
                <select required value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-slate-800 bg-white">
                  <option value="" disabled>Escolha um aluno...</option>
                  {alunos.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#004aad] mb-1">Selecione a Turma:</label>
                <select required value={selectedCohortId} onChange={(e) => setSelectedCohortId(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-slate-800 bg-white">
                  <option value="" disabled>Escolha uma turma...</option>
                  {turmas.map(t => <option key={t.id} value={t.id}>{t.internal_name} - R$ {t.price}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#004aad] mb-1">Condição de Pagamento (Parcelas):</label>
                <select value={installments} onChange={(e) => setInstallments(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-slate-800 bg-white">
                  <option value="1">À Vista (1x)</option>
                  <option value="2">2x (Parcelado)</option>
                  <option value="3">3x (Parcelado)</option>
                  <option value="4">4x (Parcelado)</option>
                  <option value="5">5x (Parcelado)</option>
                  <option value="6">6x (Parcelado)</option>
                  <option value="7">7x (Parcelado)</option>
                  <option value="8">8x (Parcelado)</option>
                  <option value="9">9x (Parcelado)</option>
                  <option value="10">10x (Parcelado)</option>
                  <option value="11">11x (Parcelado)</option>
                  <option value="12">12x (Parcelado)</option>
                </select>
              </div>

              <p className="text-xs text-slate-400">* Ao confirmar, as cobranças correspondentes serão geradas automaticamente na linha do tempo do módulo Financeiro.</p>
              
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-lg text-sm">CANCELAR</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#d4ed31] text-[#004aad] font-bold py-3 rounded-lg text-sm">CONFIRMAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedMatricula && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
             <div className="bg-[#004aad] p-5 text-white flex justify-between items-center">
              <h2 className="font-heading text-xl uppercase">Gerenciar Matrícula</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white/70 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4 font-body">
              <p className="text-sm text-slate-500 mb-2">
                Nº Matrícula: <strong className="text-[#38b6ff]">{formatMatriculaId(selectedMatricula.id)}</strong><br/>
                Aluno: <strong className="text-[#004aad]">{selectedMatricula.student_name}</strong> | Turma: <strong className="text-[#004aad]">{selectedMatricula.course_name}</strong>
              </p>
              
              <div>
                <label className="block text-sm font-semibold text-[#004aad] mb-1">Status da Matrícula</label>
                <select required value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-slate-800 bg-white">
                  <option value="INTERESSADO">Interessado</option>
                  <option value="ATIVO">Ativo</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#004aad] mb-1">Forma de Pagamento</label>
                <select required value={editPaymentMethod} onChange={(e) => setEditPaymentMethod(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-slate-800 bg-white">
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência Bancária</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-lg text-sm">VOLTAR</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#d4ed31] text-[#004aad] font-bold py-3 rounded-lg text-sm">SALVAR ALTERAÇÕES</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}