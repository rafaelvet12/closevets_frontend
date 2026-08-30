"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/app/config";

interface Course {
  id: number;
  title: string;
  internal_name: string;
  code: string;
  workload_hours: number;
  default_price: number;
  modality: string;
  is_active?: boolean;
}

export default function CursosPage() {
  const [cursos, setCursos] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; onConfirm: () => void; title: string } | null>(null);
  
  // Campos do Formulário
  const [title, setTitle] = useState("");
  const [internalName, setInternalName] = useState("");
  const [code, setCode] = useState("");
  const [workload, setWorkload] = useState("");
  const [price, setPrice] = useState("");
  const [modality, setModality] = useState("Presencial");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCursos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/courses/`);
      if (res.ok) setCursos(await res.json());
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
    }
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (!value) { setPrice(""); return; }
    const floatValue = Number(value) / 100;
    setPrice(floatValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
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

    const numericPrice = price ? Number(price.replace(/\./g, "").replace(",", ".")) : 0.0;

    try {
      const url = isEditMode ? `${API_BASE_URL}/courses/${selectedCourse?.id}` : `${API_BASE_URL}/courses/`;
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, internal_name: internalName, code, modality,
          workload_hours: Number(workload), default_price: numericPrice
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false); fetchCursos();
        showToast(isEditMode ? "Curso atualizado com sucesso!" : "Curso cadastrado com sucesso!");
      } else { showToast(data.detail || "Erro ao salvar", "error"); }
    } catch (error) { showToast("Erro de conexão.", "error"); } finally { setLoading(false); }
  };

  const handleDeactivate = (course: Course) => {
    setConfirmModal({
      show: true, 
      title: `Deseja desativar o curso ${course.title}?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/courses/${course.id}`, { method: "DELETE" });
          if (res.ok) { 
            setConfirmModal(null); 
            fetchCursos(); 
            showToast("Curso desativado com sucesso."); 
          } else {
            showToast("Erro ao desativar curso.", "error");
          }
        } catch { showToast("Erro de conexão.", "error"); }
      }
    });
  };

  const filteredCursos = cursos.filter((curso) => curso.title.toLowerCase().includes(searchTerm.toLowerCase()) || (curso.code && curso.code.toLowerCase().includes(searchTerm.toLowerCase())));

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
            <p className="font-body text-sm text-slate-500">Essa ação impedirá a criação de novas turmas baseadas neste curso.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-lg text-sm">Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-sm">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-heading text-4xl text-[#004aad] uppercase">Catálogo de Cursos</h1>
          <p className="font-body text-slate-500 mt-1">Gerencie os modelos bases de cursos da sua instituição.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input type="text" placeholder="Buscar curso ou código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-64 px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#38b6ff] text-slate-700 font-body text-sm shadow-sm" />
          <button onClick={handleOpenCreateModal} className="bg-[#004aad] hover:bg-[#003882] text-[#d4ed31] font-heading px-6 py-3 rounded-lg shadow-sm whitespace-nowrap">
            NOVO CURSO
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#f8fafc] grid grid-cols-5 p-4 border-b border-slate-100 font-body font-bold text-slate-500 text-sm uppercase">
          <div className="col-span-2">Curso / Código</div>
          <div>Modalidade</div>
          <div>Carga Horária</div>
          <div className="text-right">Ações</div>
        </div>
        
        {filteredCursos.length === 0 ? (
          <div className="p-12 text-center"><p className="font-body text-slate-500 font-medium">Nenhum curso cadastrado.</p></div>
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