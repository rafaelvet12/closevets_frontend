"use client";

import { useState, useEffect } from "react";

interface Cohort { id: number; internal_name: string; hours: number; code: string; }
interface InstructorOption { id: number; name: string; hourly_rate?: number; }
interface Schedule { 
  id: number; 
  date: string; 
  start_time: string; 
  end_time: string; 
  topic: string; 
  instructor_id: number; 
  instructor_name: string;
  executed_instructor_id?: number;
  executed_instructor_name?: string;
  hours: number; 
  real_duration_hours?: number;
  status: string; 
}

export default function CronogramasPage() {
  const [turmas, setTurmas] = useState<Cohort[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  
  const [selectedCohortId, setSelectedCohortId] = useState("");
  const [loading, setLoading] = useState(false);

  // Form Fields (Nova Aula)
  const [schDate, setSchDate] = useState("");
  const [schStart, setSchStart] = useState("");
  const [schEnd, setSchEnd] = useState("");
  const [schTopic, setSchTopic] = useState("");
  const [schInstructor, setSchInstructor] = useState("");

  // Modal de Execução / Realização da Aula
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  const [execInstructor, setExecInstructor] = useState("");
  const [execHours, setExecHours] = useState("");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type }); setTimeout(() => setToast(null), 4000);
  };

  const fetchBaseData = async () => {
    try {
      const [resTurmas, resInstructors] = await Promise.all([
        fetch(`http://https://closevets-backend.onrender.com:8000/turmas/`), fetch(`http://https://closevets-backend.onrender.com:8000/professores/`)
      ]);
      if (resTurmas.ok) setTurmas(await resTurmas.json());
      if (resInstructors.ok) setInstructors(await resInstructors.json());
    } catch (error) { console.error("Erro:", error); }
  };

  useEffect(() => { fetchBaseData(); }, []);

  const fetchSchedules = async (cohort_id: string) => {
    if (!cohort_id) return;
    try {
      const res = await fetch(`http://https://closevets-backend.onrender.com:8000/schedules/cohort/${cohort_id}`);
      if (res.ok) setSchedules(await res.json());
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchSchedules(selectedCohortId); }, [selectedCohortId]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCohortId) return;

    const [hStart, mStart] = schStart.split(':').map(Number);
    const [hEnd, mEnd] = schEnd.split(':').map(Number);
    const totalHours = ((hEnd * 60 + mEnd) - (hStart * 60 + mStart)) / 60;

    if (totalHours <= 0) { showToast("Horário final deve ser maior que o inicial.", "error"); return; }

    setLoading(true);
    try {
      const payload = {
        cohort_id: Number(selectedCohortId), instructor_id: Number(schInstructor),
        date: schDate, start_time: schStart + ":00", end_time: schEnd + ":00",
        topic: schTopic, hours: totalHours
      };
      const res = await fetch(`http://https://closevets-backend.onrender.com:8000/schedules/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast("Aula adicionada com sucesso!");
        fetchSchedules(selectedCohortId);
        setSchDate(""); setSchStart(""); setSchEnd(""); setSchTopic(""); setSchInstructor("");
      }
    } finally { setLoading(false); }
  };

  const handleOpenComplete = (sch: Schedule) => {
    setActiveSchedule(sch);
    setExecInstructor(String(sch.instructor_id));
    setExecHours(String(sch.hours));
    setCompleteModalOpen(true);
  };

  const handleSaveComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchedule) return;

    try {
      const res = await fetch(`http://https://closevets-backend.onrender.com:8000/schedules/${activeSchedule.id}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          executed_instructor_id: Number(execInstructor),
          real_duration_hours: Number(execHours)
        })
      });

      if (res.ok) {
        showToast("Aula realizada e custo computado no financeiro!");
        setCompleteModalOpen(false);
        fetchSchedules(selectedCohortId);
      } else {
        showToast("Erro ao registrar aula.", "error");
      }
    } catch {
      showToast("Erro de conexão.", "error");
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      const res = await fetch(`http://https://closevets-backend.onrender.com:8000/schedules/${id}`, { method: "DELETE" });
      if (res.ok) { showToast("Aula removida."); fetchSchedules(selectedCohortId); }
    } catch { showToast("Erro de conexão.", "error"); }
  };

  const selectedTurmaObj = turmas.find(t => t.id === Number(selectedCohortId));
  const totalScheduleHours = schedules.reduce((acc, curr) => acc + curr.hours, 0);

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

      {/* MODAL DE CONFIRMAÇÃO DE EXECUÇÃO DA AULA */}
      {completeModalOpen && activeSchedule && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden font-body">
            <div className="bg-[#004aad] p-5 text-white flex justify-between items-center">
              <h3 className="font-heading text-lg uppercase">Confirmar Realização da Aula</h3>
              <button onClick={() => setCompleteModalOpen(false)} className="text-white/70 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSaveComplete} className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Tema: <strong className="text-[#004aad]">{activeSchedule.topic}</strong></p>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">PROFESSOR QUE REALMENTE MINISTROU</label>
                <select required value={execInstructor} onChange={e => setExecInstructor(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg bg-white">
                  {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">DURAÇÃO REAL (HORAS)</label>
                <input required type="number" step="0.5" value={execHours} onChange={e => setExecHours(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg" />
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                ⚠️ Ao confirmar, o sistema calculará o valor hora do professor e gerará automaticamente o custo correspondente no Caixa Financeiro e na DRE.
              </p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCompleteModalOpen(false)} className="flex-1 bg-slate-100 py-3 rounded-lg font-bold text-slate-600 text-sm">CANCELAR</button>
                <button type="submit" className="flex-1 bg-[#d4ed31] text-[#004aad] py-3 rounded-lg font-bold text-sm">CONFIRMAR E GERAR CUSTO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="font-heading text-4xl text-[#004aad] uppercase">Grade e Cronograma</h1>
        <p className="font-body text-slate-500 mt-1">Aloque professores, confirme aulas ministradas e gere custos automáticos.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
        <label className="block text-sm font-bold text-[#004aad] mb-2 uppercase tracking-wide">Selecione a Turma Operacional</label>
        <select value={selectedCohortId} onChange={(e) => setSelectedCohortId(e.target.value)} className="w-full md:w-1/2 px-4 py-3 rounded-lg border border-slate-200 text-slate-800 bg-slate-50 font-semibold">
          <option value="" disabled>Escolha uma turma da lista...</option>
          {turmas.map(t => <option key={t.id} value={t.id}>{t.internal_name} (Código: {t.code})</option>)}
        </select>
      </div>

      {selectedCohortId && selectedTurmaObj && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-heading text-xl text-[#004aad] mb-6 uppercase border-b border-slate-100 pb-3">Lançar Nova Aula</h3>
            <form onSubmit={handleAddSchedule} className="space-y-5 font-body">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">TEMA / CONTEÚDO</label>
                <input required value={schTopic} onChange={e=>setSchTopic(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg" placeholder="Ex: Farmacologia Básica" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">PROFESSOR PREVISTO</label>
                <select required value={schInstructor} onChange={e=>setSchInstructor(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg bg-white">
                  <option value="" disabled>Selecione...</option>
                  {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">DATA DA AULA</label>
                <input required type="date" value={schDate} onChange={e=>setSchDate(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg text-slate-700" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">INÍCIO</label>
                  <input required type="time" value={schStart} onChange={e=>setSchStart(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg text-slate-700" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">TÉRMINO</label>
                  <input required type="time" value={schEnd} onChange={e=>setSchEnd(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg text-slate-700" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#d4ed31] hover:bg-[#c2d92d] text-[#004aad] font-bold py-3.5 rounded-lg mt-4 transition-colors">
                {loading ? "ADICIONANDO..." : "ADICIONAR AULA"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#f8fafc] rounded-t-2xl">
              <div>
                <h3 className="font-heading text-xl text-[#004aad] uppercase">Grade Programada</h3>
                <p className="text-sm text-slate-500 mt-0.5">{selectedTurmaObj.internal_name}</p>
              </div>
              <div className="text-right bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 font-bold uppercase block">Carga Horária Atingida</span>
                <span className={`font-heading text-xl ${totalScheduleHours !== selectedTurmaObj.hours ? "text-red-500" : "text-green-600"}`}>
                  {totalScheduleHours}h <span className="text-slate-400 text-sm">/ {selectedTurmaObj.hours}h</span>
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-auto">
              {schedules.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                  <p className="font-medium text-lg">A grade desta turma está vazia.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map(sch => (
                    <div key={sch.id} className="border border-slate-100 p-4 rounded-xl flex justify-between items-center hover:shadow-md transition-all">
                      <div className="flex gap-4 items-center">
                        <div className="bg-[#f8fafc] px-4 py-2 rounded-lg text-center border border-slate-100">
                          <span className="block text-xs font-bold text-slate-400 uppercase">Data</span>
                          <span className="font-bold text-[#004aad]">{sch.date.split('-').reverse().join('/')}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-lg">{sch.topic}</p>
                          <p className="text-sm text-slate-500">
                            Prof. Previsto: <span className="font-medium text-slate-700">{sch.instructor_name}</span>
                            {sch.executed_instructor_name && sch.executed_instructor_name !== sch.instructor_name && (
                              <span className="ml-2 text-amber-600 font-semibold">(Realizada por: {sch.executed_instructor_name})</span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-semibold">{sch.start_time.substring(0,5)} às {sch.end_time.substring(0,5)}</span>
                            <span className="px-2 py-0.5 bg-[#38b6ff]/10 text-[#004aad] rounded text-xs font-bold">{sch.hours}h</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${sch.status === 'REALIZADA' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {sch.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sch.status !== 'REALIZADA' && (
                          <button onClick={() => handleOpenComplete(sch)} className="bg-[#004aad] text-[#d4ed31] font-bold px-3 py-2 rounded-lg text-xs hover:bg-[#003882] transition-colors">
                            REALIZAR AULA
                          </button>
                        )}
                        <button onClick={() => handleDeleteSchedule(sch.id)} className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}