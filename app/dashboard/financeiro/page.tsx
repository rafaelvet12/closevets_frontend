"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/app/config";

interface Transaction {
  id: number;
  type: string;
  category: string;
  description: string;
  amount_gross: number;
  discount_or_fee: number;
  amount_net: number;
  due_date: string;
  paid_at?: string | null;
  status: string;
  cohort_id?: number | null;
}

interface Cohort {
  id: number;
  internal_name: string;
  price?: number;
}

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [turmas, setTurmas] = useState<Cohort[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Novos Filtros Adicionados
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterMonth, setFilterMonth] = useState("ALL");

  const [type, setType] = useState("EXPENSE");
  const [category, setCategory] = useState("Pagamento de Professor");
  const [description, setDescription] = useState("");
  const [amountGross, setAmountGross] = useState("");
  const [discountFee, setDiscountFee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [status, setStatus] = useState("PENDING");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [resFinance, resTurmas] = await Promise.all([
        fetch(`${API_BASE_URL}/finance/`),
        fetch(`${API_BASE_URL}/turmas/`)
      ]);
      if (resFinance.ok) setTransactions(await resFinance.json());
      if (resTurmas.ok) setTurmas(await resTurmas.json());
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!isEditMode) {
      if (type === "INCOME") setCategory("Receita Extra");
      else if (type === "EXPENSE") setCategory("Pagamento de Professor");
    }
  }, [type, isEditMode]);

  const isPaid = (s: string) => ["PAID", "PAGO", "LIQUIDADO"].includes(s.toUpperCase());
  const isPending = (s: string) => ["PENDING", "PENDENTE", "A PAGAR", "A RECEBER"].includes(s.toUpperCase());
  const isIncome = (t: string) => ["INCOME", "RECEITA", "ENTRADA"].includes(t.toUpperCase());

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (!value) { setter(""); return; }
    const floatValue = Number(value) / 100;
    setter(floatValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const formatDateToBR = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleCohortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setCohortId(selectedId);
    const cohort = turmas.find((c) => c.id === Number(selectedId));
    if (cohort && cohort.price) {
      setAmountGross(Number(cohort.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditMode(false); setSelectedTransactionId(null);
    setType("EXPENSE"); setCategory("Pagamento de Professor"); setDescription(""); 
    setAmountGross(""); setDiscountFee(""); setDueDate(""); setCohortId(""); setStatus("PENDING"); 
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: Transaction) => {
    setIsEditMode(true); setSelectedTransactionId(t.id);
    setType(isIncome(t.type) ? "INCOME" : "EXPENSE"); 
    setCategory(t.category); setDescription(t.description); 
    setAmountGross(t.amount_gross.toLocaleString("pt-BR", { minimumFractionDigits: 2 })); 
    setDiscountFee(t.discount_or_fee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })); 
    setDueDate(t.due_date); setCohortId(t.cohort_id ? String(t.cohort_id) : ""); 
    setStatus(isPaid(t.status) ? "PAID" : isPending(t.status) ? "PENDING" : "CANCELLED"); 
    setIsModalOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    
    const grossNumeric = Number(amountGross.replace(/\./g, "").replace(",", ".")) || 0;
    const discountNumeric = Number(discountFee.replace(/\./g, "").replace(",", ".")) || 0;

    const payload = {
      type: type, category: category, description: description,
      amount_gross: grossNumeric, discount_or_fee: discountNumeric,
      due_date: dueDate, status: status,
      cohort_id: cohortId ? Number(cohortId) : null,
      paid_at: status === "PAID" ? new Date().toISOString().split('T')[0] : null
    };

    try {
      const url = isEditMode ? `${API_BASE_URL}/finance/${selectedTransactionId}` : `${API_BASE_URL}/finance/`;
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false); fetchData(); showToast(isEditMode ? "Transação atualizada!" : "Transação registrada!");
      } else {
        const data = await res.json(); showToast(data.detail || "Erro ao salvar", "error");
      }
    } catch (error) { showToast("Erro de conexão.", "error"); } finally { setLoading(false); }
  };

  const handleQuickStatusChange = async (id: number, newStatus: string) => {
    try {
      const payload = { status: newStatus, paid_at: newStatus === "PAID" ? new Date().toISOString().split('T')[0] : null };
      const res = await fetch(`${API_BASE_URL}/finance/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) { fetchData(); showToast("Status atualizado!"); }
    } catch (e) { showToast("Erro na comunicação", "error"); }
  };

  // Extrai os meses disponíveis para o filtro dinâmico (formato AAAA-MM)
  const availableMonths = Array.from(new Set(transactions.map(t => t.due_date?.substring(0, 7)).filter(Boolean))).sort().reverse();
  const formatMonthBR = (yyyyMm: string) => { const [y, m] = yyyyMm.split("-"); return `${m}/${y}`; };

  // Filtra as transações para calcular os CARDS com base no mês selecionado
  const monthFilteredTransactions = filterMonth === "ALL" 
    ? transactions 
    : transactions.filter(t => t.due_date?.startsWith(filterMonth));

  const receitasPagas = monthFilteredTransactions.filter(t => isIncome(t.type) && isPaid(t.status)).reduce((acc, curr) => acc + curr.amount_net, 0);
  const despesasPagas = monthFilteredTransactions.filter(t => !isIncome(t.type) && isPaid(t.status)).reduce((acc, curr) => acc + curr.amount_net, 0);
  const saldoCaixa = receitasPagas - despesasPagas;

  // Filtra a LISTA de transações com todos os filtros aplicados
  const filteredTransactions = transactions.filter(t => {
    const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "ALL" || (filterType === "INCOME" ? isIncome(t.type) : !isIncome(t.type));
    const matchMonth = filterMonth === "ALL" || t.due_date?.startsWith(filterMonth);
    
    let matchStatus = true;
    if (filterStatus === "PAID") matchStatus = isPaid(t.status);
    if (filterStatus === "PENDING") matchStatus = isPending(t.status);

    return matchSearch && matchType && matchMonth && matchStatus;
  });

  return (
    <div className="animate-fade-in">
      {toast && (
        <div className="fixed bottom-6 right-6 z-[80]">
          <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 text-white font-body text-sm font-semibold ${toast.type === "success" ? "bg-[#004aad] border border-[#38b6ff]" : "bg-red-600"}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-white/80 hover:text-white font-bold text-lg">&times;</button>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-heading text-4xl text-[#004aad] uppercase">Gestão Financeira</h1>
          <p className="font-body text-slate-500 mt-1">Cobranças geradas e pagamentos administrativos.</p>
        </div>
        <button onClick={handleOpenCreateModal} className="bg-[#004aad] hover:bg-[#003882] text-[#d4ed31] font-heading px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap">
          LANÇAR DESPESA / EXTRA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 border-l-4 border-l-green-500">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </div>
          <div>
            <p className="font-body text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">Entradas (Pagas)</p>
            <h3 className="font-heading text-2xl text-slate-800">R$ {receitasPagas.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 border-l-4 border-l-red-500">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
          </div>
          <div>
            <p className="font-body text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">Saídas (Pagas)</p>
            <h3 className="font-heading text-2xl text-slate-800">R$ {despesasPagas.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</h3>
          </div>
        </div>

        <div className="bg-[#004aad] p-6 rounded-2xl shadow-md flex items-center gap-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-[#d4ed31] z-10">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
          </div>
          <div className="z-10">
            <p className="font-body text-sm text-[#38b6ff] font-semibold uppercase tracking-wider mb-1">Saldo em Caixa</p>
            <h3 className="font-heading text-3xl text-white">R$ {saldoCaixa.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* BARRA DE FILTROS APRIMORADA */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#f8fafc]">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            
            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
              <button onClick={() => setFilterType("ALL")} className={`px-3 py-1.5 rounded-md text-sm font-bold ${filterType === "ALL" ? "bg-[#004aad] text-white" : "text-slate-500 hover:bg-slate-50"}`}>Todos</button>
              <button onClick={() => setFilterType("INCOME")} className={`px-3 py-1.5 rounded-md text-sm font-bold ${filterType === "INCOME" ? "bg-green-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>Receitas</button>
              <button onClick={() => setFilterType("EXPENSE")} className={`px-3 py-1.5 rounded-md text-sm font-bold ${filterType === "EXPENSE" ? "bg-red-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>Despesas</button>
            </div>

            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
              <button onClick={() => setFilterStatus("ALL")} className={`px-3 py-1.5 rounded-md text-sm font-bold ${filterStatus === "ALL" ? "bg-slate-700 text-white" : "text-slate-500 hover:bg-slate-50"}`}>Status: Todos</button>
              <button onClick={() => setFilterStatus("PAID")} className={`px-3 py-1.5 rounded-md text-sm font-bold ${filterStatus === "PAID" ? "bg-green-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>Pagos</button>
              <button onClick={() => setFilterStatus("PENDING")} className={`px-3 py-1.5 rounded-md text-sm font-bold ${filterStatus === "PENDING" ? "bg-amber-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}>Pendentes</button>
            </div>

            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#38b6ff] text-slate-700 font-body text-sm font-bold bg-white"
            >
              <option value="ALL">🗓️ Todos os Meses</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{formatMonthBR(m)}</option>
              ))}
            </select>
          </div>

          <input type="text" placeholder="Buscar descrição ou categoria..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full lg:w-64 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#38b6ff] text-slate-700 font-body text-sm" />
        </div>

        <div className="grid grid-cols-6 p-4 border-b border-slate-100 font-body font-bold text-slate-500 text-sm uppercase tracking-wider bg-white">
          <div className="col-span-2">Descrição</div>
          <div>Vencimento</div>
          <div>Valor Líquido</div>
          <div>Status</div>
          <div className="text-right">Ações</div>
        </div>
        
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center"><p className="font-body text-slate-500 font-medium">Nenhuma transação encontrada para estes filtros.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((t) => (
              <div key={t.id} className="grid grid-cols-6 p-4 items-center hover:bg-slate-50 transition-colors font-body text-slate-700">
                <div className="col-span-2">
                  <div className="font-bold flex items-center gap-2 text-slate-800">
                    <span className={`w-2 h-2 rounded-full ${isIncome(t.type) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {t.description}
                  </div>
                  <span className="block text-xs text-slate-400 font-medium mt-0.5 ml-4">{t.category}</span>
                </div>
                <div className="text-slate-600 text-sm font-medium">{formatDateToBR(t.due_date)}</div>
                <div className={`text-sm font-bold ${isIncome(t.type) ? 'text-green-600' : 'text-red-600'}`}>
                  {isIncome(t.type) ? '+' : '-'} R$ {Number(t.amount_net).toLocaleString("pt-BR", {minimumFractionDigits: 2})}
                </div>
                <div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${isPaid(t.status) ? 'bg-green-100 text-green-700' : isPending(t.status) ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {isPaid(t.status) ? 'Liquidado' : isPending(t.status) ? 'Pendente' : 'Cancelado'}
                  </span>
                </div>
                <div className="text-right flex items-center justify-end gap-3">
                  <button onClick={() => handleOpenEditModal(t)} className="text-slate-400 hover:text-[#004aad] font-semibold text-sm">Editar</button>
                  {isPending(t.status) && (
                    <button onClick={() => handleQuickStatusChange(t.id, "PAID")} className="text-green-600 hover:text-green-800 font-bold text-sm">Dar Baixa</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE LANÇAMENTO MANTIDO INTACTO ABAIXO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[95vh] overflow-y-auto">
            <div className="bg-[#004aad] p-5 text-white flex justify-between items-center sticky top-0">
              <h2 className="font-heading text-xl uppercase">{isEditMode ? "Editar Lançamento" : "Lançamento de Caixa"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4 font-body">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#004aad] mb-1">Tipo</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-slate-800 bg-white">
                    <option value="INCOME">Receita (Entrada)</option>
                    <option value="EXPENSE">Despesa (Saída)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#004aad] mb-1">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-slate-800 bg-white">
                    <option value="PENDING">A Pagar / A Receber</option>
                    <option value="PAID">Liquidado (Pago)</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#004aad] mb-1">Descrição</label>
                  <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Mensalidade João" className="w-full px-4 py-3 rounded-lg border border-gray-200 text-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#004aad] mb-1">Categoria</label>
                  <select required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-slate-800 bg-white">
                    {type === "INCOME" ? (
                      <>
                        <option value="Mensalidade">Mensalidade (Automática)</option>
                        <option value="Taxa de Matrícula">Taxa de Matrícula</option>
                        <option value="Receita Extra">Receita Extra / Vendas</option>
                      </>
                    ) : (
                      <>
                        <option value="Pagamento de Professor">Pagamento de Professor</option>
                        <option value="Infraestrutura">Infraestrutura / Aluguel</option>
                        <option value="Marketing">Marketing / Anúncios</option>
                        <option value="Impostos">Impostos e Taxas</option>
                        <option value="Outras Despesas">Outras Despesas</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#004aad] mb-1">Vencimento</label>
                  <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-slate-800" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#004aad] mb-1">Valor Bruto (R$)</label>
                  <input type="text" required value={amountGross} onChange={(e) => handleCurrencyChange(e, setAmountGross)} placeholder="0,00" className="w-full px-4 py-3 rounded-lg border border-gray-200 text-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#004aad] mb-1">Desconto/Taxa (R$)</label>
                  <input type="text" value={discountFee} onChange={(e) => handleCurrencyChange(e, setDiscountFee)} placeholder="0,00" className="w-full px-4 py-3 rounded-lg border border-gray-200 text-slate-800" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#004aad] mb-1">Vincular a uma Turma (Opcional)</label>
                <select value={cohortId} onChange={handleCohortChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-slate-800 bg-white">
                  <option value="">Lançamento Avulso (Sem Turma)</option>
                  {turmas.map(t => <option key={t.id} value={t.id}>{t.internal_name}</option>)}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-lg">CANCELAR</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#d4ed31] text-[#004aad] font-bold py-3 rounded-lg">{loading ? "SALVANDO..." : (isEditMode ? "SALVAR EDIÇÃO" : "REGISTRAR")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}