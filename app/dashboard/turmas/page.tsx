"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/app/config";

interface Cohort {
  id: number;
  internal_name: string;
  code: string;
  price: number;
  hours: number;
  course_id: number;
  status: string;
}

interface CourseOption { id: number; title: string; workload_hours: number; }

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Cohort[]>([]);
  const [cursos, setCursos] = useState<CourseOption[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [internalName, setInternalName] = useState("");
  const [code, setCode] = useState("");
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState("");
  const [courseId, setCourseId] = useState("");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [resTurmas, resCursos] = await Promise.all([
        fetch(`${API_BASE_URL}/turmas/`),
        fetch(`${API_BASE_URL}/courses/`)
      ]);
      if (resTurmas.ok) setTurmas(await resTurmas.json());
      if (resCursos.ok) setCursos(await resCursos.json());
    } catch (error) { console.error("Erro:", error); }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (!value) { setPrice(""); return; }
    const floatValue = Number(value) / 100;
    setPrice(floatValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setCourseId(selectedId);
    const course = cursos.find((c) => c.id === Number(selectedId));
    if (course) setHours(String(course.workload_hours));
  };

  const handleOpenCreateModal = () => {
    setInternalName(""); setCode(""); setPrice(""); setHours(""); setCourseId(""); 
    setIsModalOpen(true);
  };

  const handleSaveTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const numericPrice = price ? Number(price.replace(/\./g, "").replace(",", ".")) : 0.0;

    try {
      const res = await fetch(`${API_BASE_URL}/turmas/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internal_name: internalName, code, course_id: Number(courseId),
          hours: Number(hours), price: numericPrice, status: "planejada"
        })
      });
      if (res.ok) {
        setIsModalOpen(false); fetchData(); showToast("Turma criada!");
      } else { showToast("Erro ao criar turma", "error"); }
    } catch (error) { showToast("Erro de conexão", "error"); } finally { setLoading(false); }
  };

  const getCourseName = (id: number) => cursos.find(c => c.id === id)?.title || "Desconhecido";
  const filteredTurmas = turmas.filter(t => t.internal_name.toLowerCase().includes(searchTerm.toLowerCase()) || t.code.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="animate-fade-in">
      {toast && (
        <div className="fixed bottom-6 right-6 z-[80]">
          <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 text-white font-body text-sm font-semibold ${toast.type === "success" ? "bg-[#004aad] border border-[#38b6ff]" : "bg-red-600"}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-white/80 font-bold">&times;</button>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-heading text-4xl text-[#004aad] uppercase">Gestão de Turmas</h1>
          <p className="font-body text-slate-500 mt-1">Crie edições dos cursos para receber matrículas.</p>
        </div>
        <div className="flex items-center gap-4">
          <input type="text" placeholder="Buscar turma ou código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#38b6ff] shadow-sm" />
          <button onClick={handleOpenCreateModal} className="bg-[#004aad] hover:bg-[#003882] text-[#d4ed31] font-heading px-6 py-3 rounded-lg shadow-sm whitespace-nowrap">
            NOVA TURMA
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#f8fafc] grid grid-cols-5 p-4 border-b font-bold text-slate-500 text-sm uppercase">
          <div className="col-span-2">Turma / Código</div>
          <div>Curso Base</div>
          <div>Preço / Carga</div>
          <div className="text-right">Ações</div>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredTurmas.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">Nenhuma turma encontrada.</div>
          ) : (
            filteredTurmas.map((turma) => (
              <div key={turma.id} className="grid grid-cols-5 p-4 items-center font-body text-slate-700 hover:bg-slate-50">
                <div className="col-span-2 font-bold text-[#004aad]">{turma.internal_name}
                  <span className="block text-xs text-slate-400">Código: {turma.code}</span>
                </div>
                <div className="text-sm">{getCourseName(turma.course_id)}</div>
                <div className="text-sm"><span className="font-semibold text-[#004aad]">R$ {turma.price.toFixed(2)}</span> / {turma.hours}h</div>
                <div className="text-right">
                  <Link href="/dashboard/cronogramas" className="text-amber-600 hover:text-amber-800 font-bold text-sm bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors">
                    Montar Cronograma
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-[#004aad] p-5 text-white flex justify-between items-center">
              <h2 className="font-heading text-xl uppercase">Cadastrar Turma</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSaveTurma} className="p-6 space-y-4 font-body">
              <div>
                <label className="block text-sm font-semibold text-[#004aad] mb-1">Curso Base</label>
                <select required value={courseId} onChange={handleCourseChange} className="w-full px-4 py-3 rounded-lg border bg-white text-slate-800">
                  <option value="" disabled>Selecione um curso do catálogo...</option>
                  {cursos.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-[#004aad] mb-1">Nome Interno</label><input required value={internalName} onChange={e=>setInternalName(e.target.value)} className="w-full px-4 py-3 rounded-lg border" placeholder="Ex: Turma Out/2026" /></div>
                <div><label className="block text-sm font-semibold text-[#004aad] mb-1">Código da Turma</label><input required value={code} onChange={e=>setCode(e.target.value.toUpperCase())} className="w-full px-4 py-3 rounded-lg border" placeholder="Ex: T-OUT26" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-[#004aad] mb-1">Carga Horária (h)</label><input required type="number" value={hours} onChange={e=>setHours(e.target.value)} className="w-full px-4 py-3 rounded-lg border" /></div>
                <div><label className="block text-sm font-semibold text-[#004aad] mb-1">Valor Final (R$)</label><input required value={price} onChange={handlePriceChange} className="w-full px-4 py-3 rounded-lg border" placeholder="0,00" /></div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 font-bold py-3 rounded-lg">CANCELAR</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#d4ed31] text-[#004aad] font-bold py-3 rounded-lg disabled:opacity-50">{loading ? "SALVANDO..." : "SALVAR TURMA"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}