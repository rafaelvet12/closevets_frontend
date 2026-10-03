"use client";

import { useState, useEffect } from "react";
import ConfirmDialog from "@/app/components/confirm-dialog";
import Toast from "@/app/components/toast";
import { useToast } from "@/app/hooks/useToast";
import { errorMessage } from "@/app/lib/api";
import { EDIT_STATUS_REVERSE_MAP, getStatusDisplay } from "@/app/lib/enrollment-status";
import { formatEnrollmentId } from "@/app/lib/format";
import { createEnrollment, listCohorts, listEnrollments, listStudents, updateEnrollment } from "@/app/services/closevets";
import type { Enrollment, NamedOption } from "@/app/types/domain";

export default function MatriculasPage() {
  const [matriculas, setMatriculas] = useState<Enrollment[]>([]);
  const [alunos, setAlunos] = useState<NamedOption[]>([]);
  const [turmas, setTurmas] = useState<NamedOption[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; onConfirm: () => void; title: string } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCohortId, setSelectedCohortId] = useState("");
  const [installments, setInstallments] = useState("1");
  
  const [selectedMatricula, setSelectedMatricula] = useState<Enrollment | null>(null);
  const [editStatus, setEditStatus] = useState("ATIVO");
  const [editPaymentMethod, setEditPaymentMethod] = useState("Pix");
  
  const { toast, showToast, closeToast } = useToast();

  const fetchData = async () => {
    try {
      const [matriculasData, alunosData, turmasData] = await Promise.all([
        listEnrollments(),
        listStudents(),
        listCohorts(),
      ]);
      setMatriculas(matriculasData);
      setAlunos(alunosData);
      setTurmas(turmasData);
    } catch (error) {
      showToast(errorMessage(error, "Erro ao buscar dados."), "error");
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
      await createEnrollment({
        student_id: Number(selectedStudentId),
        cohort_id: Number(selectedCohortId),
        full_price: fullPrice,
        discount: 0.0,
        installments: Number(installments),
      });
      setIsModalOpen(false);
      setSelectedStudentId("");
      setSelectedCohortId("");
      setInstallments("1");
      fetchData();
      showToast("Matrícula realizada e cobranças geradas com sucesso!");
    } catch (error) {
      showToast(errorMessage(error, "Erro de conexão."), "error");
    } finally { setLoading(false); }
  };

  const handleOpenEdit = (mat: Enrollment) => {
    setSelectedMatricula(mat);
    setEditStatus(EDIT_STATUS_REVERSE_MAP[mat.status] || "ATIVO");
    setEditPaymentMethod(mat.payment_method || "Pix");
    setIsEditModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!selectedMatricula) return;
      await updateEnrollment(selectedMatricula.id, {
        status: editStatus,
        payment_method: editPaymentMethod,
      });
      setIsEditModalOpen(false);
      fetchData();
      showToast("Matrícula atualizada com sucesso!");
    } catch (error) {
      showToast(errorMessage(error, "Erro de conexão."), "error");
    } finally { setLoading(false); }
  };

  const handleCancelEnrollment = (mat: Enrollment) => {
    setConfirmModal({
      show: true,
      title: `Deseja cancelar a matrícula de ${mat.student_name}?`,
      onConfirm: async () => {
        try {
          await updateEnrollment(mat.id, {
            status: "CANCELADO",
            payment_method: mat.payment_method || "Pix",
          });
          setConfirmModal(null);
          fetchData();
          showToast("Matrícula cancelada com sucesso.");
        } catch (error) {
          showToast(errorMessage(error, "Erro de conexão."), "error");
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <ConfirmDialog
        open={Boolean(confirmModal?.show)}
        title={confirmModal?.title || ""}
        description="Essa ação alterará o status da matrícula para cancelado no sistema."
        cancelLabel="Voltar"
        onCancel={() => setConfirmModal(null)}
        onConfirm={() => confirmModal?.onConfirm()}
      />

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
                    <strong className="text-[#38b6ff] mr-1">{formatEnrollmentId(mat.id)}</strong> • {mat.course_name} (R$ {mat.final_price.toFixed(2)})
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
                Nº Matrícula: <strong className="text-[#38b6ff]">{formatEnrollmentId(selectedMatricula.id)}</strong><br/>
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