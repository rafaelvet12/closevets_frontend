"use client";

import { useState, useEffect } from "react";
import ConfirmDialog from "@/app/components/confirm-dialog";
import EmptyState from "@/app/components/empty-state";
import PageHeader from "@/app/components/page-header";
import Toast from "@/app/components/toast";
import { useToast } from "@/app/hooks/useToast";
import { errorMessage } from "@/app/lib/api";
import { maskCurrency, parseCurrency } from "@/app/lib/format";
import { deactivateCourse, listCourses, saveCourse } from "@/app/services/closevets";
import type { Course } from "@/app/types/domain";

export default function CursosPage() {
  const [cursos, setCursos] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast, showToast, closeToast } = useToast();
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; onConfirm: () => void; title: string } | null>(null);
  
  // Campos do Formulário
  const [title, setTitle] = useState("");
  const [internalName, setInternalName] = useState("");
  const [code, setCode] = useState("");
  const [workload, setWorkload] = useState("");
  const [price, setPrice] = useState("");
  const [modality, setModality] = useState("Presencial");

  const fetchCursos = async () => {
    try {
      setCursos(await listCourses());
    } catch (error) {
      showToast(errorMessage(error, "Erro ao buscar cursos."), "error");
    }
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(maskCurrency(e.target.value));
  };

  const handleOpenCreateModal = () => {
    setIsEditMode(false); setSelectedCourse(null);
    setTitle(""); setInternalName(""); setCode(""); setWorkload(""); setPrice(""); setModality("Presencial");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setIsEditMode(true); setSelectedCourse(course);
    setTitle(course.title); setInternalName(course.internal_name || ""); setCode(course.code || "");
    setWorkload(String(course.workload_hours)); 
    setPrice(course.default_price ? course.default_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "");
    setModality(course.modality || "Presencial");
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const numericPrice = parseCurrency(price);

    try {
      await saveCourse(isEditMode ? selectedCourse?.id : undefined, {
        title, internal_name: internalName, code, modality,
        workload_hours: Number(workload), default_price: numericPrice,
      });
      setIsModalOpen(false);
      fetchCursos();
      showToast(isEditMode ? "Curso atualizado com sucesso!" : "Curso cadastrado com sucesso!");
    } catch (error) {
      showToast(errorMessage(error, "Erro de conexão."), "error");
    } finally { setLoading(false); }
  };

  const handleDeactivate = (course: Course) => {
    setConfirmModal({
      show: true, 
      title: `Deseja desativar o curso ${course.title}?`,
      onConfirm: async () => {
        try {
          await deactivateCourse(course.id);
          setConfirmModal(null);
          fetchCursos();
          showToast("Curso desativado com sucesso.");
        } catch (error) {
          showToast(errorMessage(error, "Erro de conexão."), "error");
        }
      }
    });
  };

  const filteredCursos = cursos.filter((curso) => curso.title.toLowerCase().includes(searchTerm.toLowerCase()) || (curso.code && curso.code.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <ConfirmDialog
        open={Boolean(confirmModal?.show)}
        title={confirmModal?.title || ""}
        description="Essa ação impedirá a criação de novas turmas baseadas neste curso."
        onCancel={() => setConfirmModal(null)}
        onConfirm={() => confirmModal?.onConfirm()}
      />

      <PageHeader
        title="Catálogo de Cursos"
        description="Gerencie os modelos bases de cursos da sua instituição."
        search={searchTerm}
        searchPlaceholder="Buscar curso ou código..."
        onSearch={setSearchTerm}
        actionLabel="NOVO CURSO"
        onAction={handleOpenCreateModal}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#f8fafc] grid grid-cols-5 p-4 border-b border-slate-100 font-body font-bold text-slate-500 text-sm uppercase">
          <div className="col-span-2">Curso / Código</div>
          <div>Modalidade</div>
          <div>Carga Horária</div>
          <div className="text-right">Ações</div>
        </div>
        
        {filteredCursos.length === 0 ? (
          <EmptyState message="Nenhum curso cadastrado." />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCursos.map((curso) => (
              <div key={curso.id} className="grid grid-cols-5 p-4 items-center hover:bg-slate-50 font-body text-slate-700 transition-colors">
                <div className="col-span-2 font-bold text-[#004aad]">{curso.title}
                  <span className="block text-xs text-slate-400 font-medium mt-0.5">{curso.code}</span>
                </div>
                <div><span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold uppercase">{curso.modality || "Presencial"}</span></div>
                <div className="text-sm font-semibold">{curso.workload_hours}h</div>
                <div className="text-right flex items-center justify-end gap-3">
                  <button onClick={() => handleOpenEditModal(curso)} className="text-[#38b6ff] hover:text-[#004aad] font-semibold text-sm transition-colors">Editar</button>
                  <button onClick={() => handleDeactivate(curso)} className="text-slate-400 hover:text-red-600 font-semibold text-sm transition-colors">Desativar</button>
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
              <h2 className="font-heading text-2xl uppercase">{isEditMode ? "Editar Curso Base" : "Cadastrar Novo Curso Base"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSaveCourse} className="p-6 space-y-4 font-body">
              <div>
                <label className="block text-sm font-semibold text-[#004aad] mb-1">Título Oficial (Certificado)</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200" placeholder="Ex: Auxiliar Veterinário" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-[#004aad] mb-1">Nome Reduzido (Interno)</label><input required value={internalName} onChange={e => setInternalName(e.target.value)} className="w-full px-4 py-3 rounded-lg border" placeholder="Ex: AuxVet" /></div>
                <div><label className="block text-sm font-semibold text-[#004aad] mb-1">Código Base</label><input required value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="w-full px-4 py-3 rounded-lg border" placeholder="AUX-001" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-semibold text-[#004aad] mb-1">Modalidade</label><select value={modality} onChange={e => setModality(e.target.value)} className="w-full px-4 py-3 rounded-lg border bg-white"><option>Presencial</option><option>Online</option><option>Híbrido</option></select></div>
                <div><label className="block text-sm font-semibold text-[#004aad] mb-1">Carga Horária (h)</label><input type="number" required value={workload} onChange={(e) => setWorkload(e.target.value)} className="w-full px-4 py-3 rounded-lg border" placeholder="120" /></div>
                <div><label className="block text-sm font-semibold text-[#004aad] mb-1">Valor Padrão (R$)</label><input required value={price} onChange={handlePriceChange} className="w-full px-4 py-3 rounded-lg border" placeholder="0,00" /></div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 font-bold py-3 rounded-lg">CANCELAR</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#d4ed31] text-[#004aad] font-bold py-3 rounded-lg disabled:opacity-50">
                  {loading ? "SALVANDO..." : "SALVAR CURSO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}