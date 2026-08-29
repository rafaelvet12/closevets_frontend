"use client";

import { useState, useEffect } from "react";

interface Cohort {
  id: number;
  internal_name: string;
  price?: number;
}

interface DREData {
  total_gross: number;
  total_discount: number;
  total_income: number;
  total_expense: number;
  profit: number;
  margin_percentage: number;
}

interface Enrollment {
  id: number;
  cohort_id: number;
  full_price?: number;
  discount?: number;
  final_price: number;
  status: string;
}

export default function DREPage() {
  const [turmas, setTurmas] = useState<Cohort[]>([]);
  const [matriculas, setMatriculas] = useState<Enrollment[]>([]);
  const [selectedCohort, setSelectedCohort] = useState("");
  const [dreData, setDreData] = useState<DREData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("https://closevets-backend.onrender.com/turmas/").then(res => res.json()),
      fetch("https://closevets-backend.onrender.com/matriculas/").then(res => res.json())
    ])
      .then(([turmasData, matriculasData]) => {
        setTurmas(turmasData);
        setMatriculas(matriculasData);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedCohort) { setDreData(null); return; }
    
    setLoading(true);
    fetch(`https://closevets-backend.onrender.com/dashboard/dre/${selectedCohort}`)
      .then(res => res.json())
      .then(data => setDreData(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCohort]);

  const turmaSelecionada = turmas.find(t => t.id === Number(selectedCohort));
  
  const matriculasTurma = matriculas.filter(
    m => m.cohort_id === Number(selectedCohort) && m.status !== "CANCELADO"
  );
  
  let receitaBrutaCalc = 0;
  let totalDescontosCalc = 0;

  matriculasTurma.forEach(m => {
    const valorTabela = m.full_price ?? turmaSelecionada?.price ?? m.final_price;
    const valorFinal = m.final_price ?? valorTabela;
    const descontoReg = m.discount ?? Math.max(0, valorTabela - valorFinal);

    receitaBrutaCalc += valorTabela;
    totalDescontosCalc += descontoReg;
  });

  const receitaLiquida = dreData?.total_income ?? (receitaBrutaCalc - totalDescontosCalc);
  const custosOp = dreData?.total_expense || 0;
  const resultado = dreData?.profit || 0;
  const margem = dreData?.margin_percentage || 0;

  const baseBruta = dreData?.total_gross ?? (receitaBrutaCalc > 0 ? receitaBrutaCalc : receitaLiquida);
  const totalDescontos = dreData?.total_discount ?? totalDescontosCalc;

  return (
    <div className="animate-fade-in font-body max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-[#004aad] uppercase">DRE por Turma</h1>
        <p className="text-slate-500 mt-1">Demonstração do Resultado do Exercício consolidado por curso.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 max-w-xl">
        <label className="block text-sm font-bold text-[#004aad] mb-2 uppercase tracking-wide">Selecione a Turma para apuração:</label>
        <select value={selectedCohort} onChange={e => setSelectedCohort(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg text-slate-700 font-medium bg-white">
          <option value="">Escolha uma turma para gerar o relatório...</option>
          {turmas.map(t => <option key={t.id} value={t.id}>{t.internal_name} (R$ {t.price})</option>)}
        </select>
      </div>

      {loading && (
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-[#38b6ff] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-[#004aad] font-bold">Calculando fechamento...</p>
        </div>
      )}

      {!loading && dreData && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl">
          
          {/* Cabeçalho da Tabela Contábil */}
          <div className="bg-[#004aad] text-white p-5 flex justify-between items-center">
            <div>
              <h2 className="font-heading text-xl uppercase tracking-wider">DRE Gerencial Consolidado</h2>
              <p className="text-xs text-[#38b6ff] mt-0.5">Turma: <span className="font-bold text-white">{turmaSelecionada?.internal_name || "Selecionada"}</span></p>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase tracking-widest text-slate-300 block">Status</span>
              <span className="text-xs font-bold bg-[#d4ed31] text-[#004aad] px-3 py-1 rounded-full uppercase">Oficial</span>
            </div>
          </div>

          {/* Linhas da Tabela em Cascata */}
          <div className="divide-y divide-slate-100 text-sm text-slate-700">
            
            {/* Receita Bruta */}
            <div className="grid grid-cols-12 p-4 bg-slate-50/50 font-semibold">
              <div className="col-span-8 text-[#004aad] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#004aad]"></span>
                (=) RECEITA BRUTA (VALOR DO CURSO)
              </div>
              <div className="col-span-2 text-right font-mono text-slate-900">R$ {baseBruta.toFixed(2)}</div>
              <div className="col-span-2 text-right font-mono text-slate-400">100.0%</div>
            </div>

            {/* Descontos / Deduções */}
            <div className="grid grid-cols-12 p-3 text-xs pl-8">
              <div className="col-span-8 text-slate-500">(-) Descontos Concedidos / Deduções</div>
              <div className="col-span-2 text-right font-mono text-red-600">- R$ {totalDescontos.toFixed(2)}</div>
              <div className="col-span-2 text-right font-mono text-slate-400">
                {baseBruta > 0 ? ((totalDescontos / baseBruta) * 100).toFixed(1) : 0}%
              </div>
            </div>

            {/* Receita Líquida */}
            <div className="grid grid-cols-12 p-4 bg-slate-100 font-bold">
              <div className="col-span-8 text-[#004aad]">(=) RECEITA LÍQUIDA (INSCRIÇÕES)</div>
              <div className="col-span-2 text-right font-mono text-[#004aad]">R$ {dreData.total_income.toFixed(2)}</div>
              <div className="col-span-2 text-right font-mono text-[#004aad]">
                {baseBruta > 0 ? ((dreData.total_income / baseBruta) * 100).toFixed(1) : 0}%
              </div>
            </div>

            {/* Custo Operacional */}
            <div className="grid grid-cols-12 p-3 text-xs pl-8">
              <div className="col-span-8 text-slate-500">(-) Custo Operacional (Professores, Ads, etc)</div>
              <div className="col-span-2 text-right font-mono text-red-600">- R$ {custosOp.toFixed(2)}</div>
              <div className="col-span-2 text-right font-mono text-slate-400">
                {baseBruta > 0 ? ((custosOp / baseBruta) * 100).toFixed(1) : 0}%
              </div>
            </div>

            {/* Resultado Líquido Final */}
            <div className={`grid grid-cols-12 p-5 font-bold text-base ${resultado >= 0 ? "bg-[#d4ed31]/20 text-[#004aad]" : "bg-red-50 text-red-700"}`}>
              <div className="col-span-8 uppercase flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${resultado >= 0 ? "bg-green-600" : "bg-red-600"}`}></span>
                (=) RESULTADO DA TURMA (LUCRO / PREJUÍZO)
              </div>
              <div className="col-span-2 text-right font-mono text-lg">R$ {resultado.toFixed(2)}</div>
              <div className="col-span-2 text-right font-mono text-lg">{margem}%</div>
            </div>

          </div>

          {/* Rodapé explicativo */}
          <div className="bg-slate-50 p-4 text-xs text-slate-500 flex justify-between items-center border-t border-slate-200">
            <span>* Apuração em tempo real baseada nos lançamentos vinculados à edição da turma.</span>
            <span className="font-semibold text-[#004aad]">CloseVets Gestão Financeira</span>
          </div>

        </div>
      )}
    </div>
  );
}