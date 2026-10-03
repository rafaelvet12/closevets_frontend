"use client";

import { useState, useEffect } from "react";
import Toast from "@/app/components/toast";
import { useToast } from "@/app/hooks/useToast";
import { errorMessage } from "@/app/lib/api";
import { isIncomeType, isPaidStatus, isPendingStatus } from "@/app/lib/finance-status";
import { currentYearMonth, formatIsoDateToBr, formatMonthLabel, maskCurrency, parseCurrency, todayIsoDate } from "@/app/lib/format";
import { listCohorts, listTransactions, saveTransaction, updateTransactionStatus } from "@/app/services/closevets";
import type { Cohort, Transaction } from "@/app/types/domain";

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [turmas, setTurmas] = useState<Cohort[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  // O filtro agora nasce travado no mês atual, e não mais em "ALL"
  const [filterMonth, setFilterMonth] = useState(currentYearMonth());

  const [type, setType] = useState("EXPENSE");
  const [category, setCategory] = useState("Pagamento de Professor");
  const [description, setDescription] = useState("");
  const [amountGross, setAmountGross] = useState("");
  const [discountFee, setDiscountFee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [status, setStatus] = useState("PENDING");

  const { toast, showToast, closeToast } = useToast();

  const fetchData = async () => {
    try {
      const [financeData, turmasData] = await Promise.all([listTransactions(), listCohorts()]);
      setTransactions(financeData);
      setTurmas(turmasData);
    } catch (error) {
      showToast(errorMessage(error, "Erro ao buscar dados."), "error");
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!isEditMode) {
      if (type === "INCOME") setCategory("Receita Extra");
      else if (type === "EXPENSE") setCategory("Pagamento de Professor");
    }
  }, [type, isEditMode]);

  const handleCurrencyChange = (event: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(maskCurrency(event.target.value));
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
    setType(isIncomeType(t.type) ? "INCOME" : "EXPENSE"); 
    setCategory(t.category); setDescription(t.description); 
    setAmountGross(t.amount_gross.toLocaleString("pt-BR", { minimumFractionDigits: 2 })); 
    setDiscountFee(t.discount_or_fee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })); 
    setDueDate(t.due_date); setCohortId(t.cohort_id ? String(t.cohort_id) : ""); 
    setStatus(isPaidStatus(t.status) ? "PAID" : isPendingStatus(t.status) ? "PENDING" : "CANCELLED"); 
    setIsModalOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    
    const grossNumeric = parseCurrency(amountGross);
    const discountNumeric = parseCurrency(discountFee);

    const payload = {
      type: type, category: category, description: description,
      amount_gross: grossNumeric, discount_or_fee: discountNumeric,
      due_date: dueDate, status: status,
      cohort_id: cohortId ? Number(cohortId) : null,
      paid_at: status === "PAID" ? todayIsoDate() : null
    };

    try {
      await saveTransaction(isEditMode ? selectedTransactionId : null, payload);
      setIsModalOpen(false);
      fetchData();
      showToast(isEditMode ? "Transação atualizada!" : "Transação registrada!");
    } catch (error) {
      showToast(errorMessage(error, "Erro de conexão."), "error");
    } finally { setLoading(false); }
  };

  const handleQuickStatusChange = async (id: number, newStatus: string) => {
    try {
      await updateTransactionStatus(id, {
        status: newStatus,
        paid_at: newStatus === "PAID" ? todayIsoDate() : null,
      });
      fetchData();
      showToast("Status atualizado!");
    } catch (error) {
      showToast(errorMessage(error, "Erro na comunicação."), "error");
    }
  };

  // Garante que o mês atual sempre apareça no seletor, mesmo se não houver lançamentos nele ainda
  const availableMonths = Array.from(new Set([
    currentYearMonth(), 
    ...transactions.map(t => t.due_date?.substring(0, 7)).filter(Boolean)
  ])).sort().reverse();
  
  const monthFilteredTransactions = filterMonth === "ALL" 
    ? transactions 
    : transactions.filter(t => t.due_date?.startsWith(filterMonth));

  const receitasPagas = monthFilteredTransactions.filter(t => isIncomeType(t.type) && isPaidStatus(t.status)).reduce((acc, curr) => acc + curr.amount_net, 0);
  const despesasPagas = monthFilteredTransactions.filter(t => !isIncomeType(t.type) && isPaidStatus(t.status)).reduce((acc, curr) => acc + curr.amount_net, 0);
  const saldoCaixa = receitasPagas - despesasPagas;

  const filteredTransactions = transactions.filter(t => {
    const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "ALL" || (filterType === "INCOME" ? isIncomeType(t.type) : !isIncomeType(t.type));
    const matchMonth = filterMonth === "ALL" || t.due_date?.startsWith(filterMonth);
    
    let matchStatus = true;
    if (filterStatus === "PAID") matchStatus = isPaidStatus(t.status);
    if (filterStatus === "PENDING") matchStatus = isPendingStatus(t.status);

    return matchSearch && matchType && matchMonth && matchStatus;
  });

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

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
            <p className="font-body text-sm text-[#38b6ff] font-semibold uppercase tracking-wider mb-1">Saldo do Mês</p>
            <h3 className="font-heading text-3xl text-white">R$ {saldoCaixa.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
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
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
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
                    <span className={`w-2 h-2 rounded-full ${isIncomeType(t.type) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {t.description}
                  </div>
                  <span className="block text-xs text-slate-400 font-medium mt-0.5 ml-4">{t.category}</span>
                </div>
                <div className="text-slate-600 text-sm font-medium">{formatIsoDateToBr(t.due_date)}</div>
                <div className={`text-sm font-bold ${isIncomeType(t.type) ? 'text-green-600' : 'text-red-600'}`}>
                  {isIncomeType(t.type) ? '+' : '-'} R$ {Number(t.amount_net).toLocaleString("pt-BR", {minimumFractionDigits: 2})}
                </div>
                <div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${isPaidStatus(t.status) ? 'bg-green-100 text-green-700' : isPendingStatus(t.status) ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {isPaidStatus(t.status) ? 'Liquidado' : isPendingStatus(t.status) ? 'Pendente' : 'Cancelado'}
                  </span>
                </div>
                <div className="text-right flex items-center justify-end gap-3">
                  <button onClick={() => handleOpenEditModal(t)} className="text-slate-400 hover:text-[#004aad] font-semibold text-sm">Editar</button>
                  {isPendingStatus(t.status) && (
                    <button onClick={() => handleQuickStatusChange(t.id, "PAID")} className="text-green-600 hover:text-green-800 font-bold text-sm">Dar Baixa</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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