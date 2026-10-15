"use client";

import { useState, useEffect } from "react";
import EmptyState from "@/app/components/empty-state";
import Modal from "@/app/components/modal";
import PageHeader from "@/app/components/page-header";
import Toast from "@/app/components/toast";
import { useToast } from "@/app/hooks/useToast";
import { errorMessage } from "@/app/lib/api";
import { formatCpf } from "@/app/lib/format";
import {
  downloadCertificate,
  downloadCohortCertificatesZip,
  issueBatchCertificates,
  issueCertificate,
  listCertificates,
  listCohortCandidates,
  listCohorts,
} from "@/app/services/closevets";
import type {
  BatchCandidateStudent,
  Certificate,
  Cohort,
} from "@/app/types/domain";

export default function CertificadosPage() {
  const [activeTab, setActiveTab] = useState<"batch" | "history">("batch");

  // Dados gerais
  const [turmas, setTurmas] = useState<Cohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const [candidates, setCandidates] = useState<BatchCandidateStudent[]>([]);
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<number[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);

  // Histórico geral e emissão avulsa
  const [certificados, setCertificados] = useState<Certificate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matriculaId, setMatriculaId] = useState("");
  const [loadingIndividual, setLoadingIndividual] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { toast, showToast, closeToast } = useToast(6000);

  // Carrega turmas e certificados na montagem
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [turmasData, certsData] = await Promise.all([
          listCohorts(),
          listCertificates(),
        ]);
        setTurmas(turmasData);
        setCertificados(certsData);
        if (turmasData.length > 0) {
          setSelectedCohortId(String(turmasData[0].id));
        }
      } catch (error) {
        showToast(errorMessage(error, "Erro ao carregar dados iniciais."), "error");
      }
    }
    loadInitialData();
  }, []);

  // Recarrega candidatos ao trocar de turma selecionada
  useEffect(() => {
    if (!selectedCohortId) {
      setCandidates([]);
      setSelectedEnrollmentIds([]);
      return;
    }

    async function loadCandidates() {
      setLoadingCandidates(true);
      try {
        const data = await listCohortCandidates(Number(selectedCohortId));
        setCandidates(data);
        // Reseta seleções
        setSelectedEnrollmentIds([]);
      } catch (error) {
        showToast(errorMessage(error, "Erro ao carregar alunos da turma."), "error");
      } finally {
        setLoadingCandidates(false);
      }
    }

    loadCandidates();
  }, [selectedCohortId]);

  const fetchCertificados = async () => {
    try {
      setCertificados(await listCertificates());
    } catch (error) {
      showToast(errorMessage(error, "Erro ao buscar certificados."), "error");
    }
  };

  const reloadCurrentCohort = async () => {
    if (!selectedCohortId) return;
    try {
      const data = await listCohortCandidates(Number(selectedCohortId));
      setCandidates(data);
      setSelectedEnrollmentIds([]);
      await fetchCertificados();
    } catch (error) {
      showToast(errorMessage(error, "Erro ao atualizar dados da turma."), "error");
    }
  };

  // Seleciona ou desmarca todos os aptos
  const handleToggleSelectAllAptos = () => {
    const aptosIds = candidates.filter((c) => c.can_issue).map((c) => c.enrollment_id);
    if (aptosIds.length === 0) return;

    const allSelected = aptosIds.every((id) => selectedEnrollmentIds.includes(id));
    if (allSelected) {
      // Desmarca todos
      setSelectedEnrollmentIds([]);
    } else {
      // Marca todos os aptos
      setSelectedEnrollmentIds(aptosIds);
    }
  };

  const handleToggleStudent = (enrollmentId: number) => {
    if (selectedEnrollmentIds.includes(enrollmentId)) {
      setSelectedEnrollmentIds(selectedEnrollmentIds.filter((id) => id !== enrollmentId));
    } else {
      setSelectedEnrollmentIds([...selectedEnrollmentIds, enrollmentId]);
    }
  };

  // Emissão em lote
  const handleEmitirLote = async () => {
    if (selectedEnrollmentIds.length === 0) {
      showToast("Selecione pelo menos um aluno apto para emitir.", "info");
      return;
    }

    setBatchLoading(true);
    try {
      const res = await issueBatchCertificates(selectedEnrollmentIds);
      if (res.total_success > 0) {
        showToast(
          `🎉 Sucesso! ${res.total_success} certificado(s) emitido(s) com sucesso!`,
          "success"
        );
      }
      if (res.total_failed > 0) {
        showToast(
          `Aviso: ${res.total_failed} matrícula(s) não puderam ser emitidas.`,
          "info"
        );
      }
      await reloadCurrentCohort();
    } catch (error) {
      showToast(errorMessage(error, "Erro ao processar emissão em lote."), "error");
    } finally {
      setBatchLoading(false);
    }
  };

  // Download ZIP da turma inteira
  const handleDownloadZip = async () => {
    if (!selectedCohortId) return;
    const turmaObj = turmas.find((t) => t.id === Number(selectedCohortId));
    const cohortCode = turmaObj?.code || `Turma_${selectedCohortId}`;

    setZipLoading(true);
    try {
      await downloadCohortCertificatesZip(Number(selectedCohortId), cohortCode);
      showToast("Download do arquivo ZIP iniciado com sucesso!", "success");
    } catch (error) {
      showToast(errorMessage(error, "Não foi possível baixar os certificados da turma."), "error");
    } finally {
      setZipLoading(false);
    }
  };

  // Emissão manual avulsa
  const handleEmitirIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matriculaId) return;

    setLoadingIndividual(true);
    const cleanId = matriculaId.replace(/\D/g, "");
    if (!cleanId) {
      showToast("Informe um número de matrícula válido.", "info");
      setLoadingIndividual(false);
      return;
    }

    try {
      const data = await issueCertificate(Number(cleanId));
      setIsModalOpen(false);
      setMatriculaId("");
      await fetchCertificados();
      await reloadCurrentCohort();
      showToast(`Sucesso! Certificado ${data.uuid_code} emitido.`);
    } catch (error) {
      showToast(errorMessage(error, "Erro de conexão."), "error");
    } finally {
      setLoadingIndividual(false);
    }
  };

  const handleDownload = async (uuid: string) => {
    try {
      await downloadCertificate(uuid);
    } catch (error) {
      showToast(errorMessage(error, "Não foi possível baixar o certificado."), "error");
    }
  };

  // Cálculos de resumo da turma selecionada
  const totalAlunosTurma = candidates.length;
  const aptosTurma = candidates.filter((c) => c.can_issue).length;
  const emitidosTurma = candidates.filter((c) => c.has_certificate).length;
  const pendentesTurma = candidates.filter((c) => !c.is_completed).length;

  const filteredHistory = certificados.filter(
    (c) =>
      c.uuid_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.snapshot_data.aluno_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.snapshot_data.turma_codigo &&
        c.snapshot_data.turma_codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-fade-in space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-[#004aad] uppercase tracking-wide">
            Emissão de Certificados
          </h1>
          <p className="font-body text-slate-500 text-sm mt-1">
            Gere certificados oficiais autenticados em lote por turma ou consulte o histórico completo.
          </p>
        </div>

        {/* Abas de Navegação */}
        <div className="inline-flex bg-slate-200/80 p-1 rounded-xl font-body text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab("batch")}
            className={`px-4 py-2.5 rounded-lg transition-all ${
              activeTab === "batch"
                ? "bg-[#004aad] text-white shadow-sm"
                : "hover:text-[#004aad]"
            }`}
          >
            🎓 EMISSÃO EM LOTE POR TURMA
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 rounded-lg transition-all ${
              activeTab === "history"
                ? "bg-[#004aad] text-white shadow-sm"
                : "hover:text-[#004aad]"
            }`}
          >
            📋 HISTÓRICO GERAL ({certificados.length})
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ABA 1: EMISSÃO EM LOTE POR TURMA (FORMATO 1)              */}
      {/* ======================================================== */}
      {activeTab === "batch" && (
        <div className="space-y-6">
          {/* Seletor de Turma e Estatísticas */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#004aad] mb-2 font-body">
                  Selecione a Turma para Emissão:
                </label>
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-body font-semibold focus:outline-none focus:ring-2 focus:ring-[#38b6ff] cursor-pointer"
                >
                  {turmas.length === 0 ? (
                    <option value="">Nenhuma turma cadastrada</option>
                  ) : (
                    turmas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} — {t.internal_name} ({t.status})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Ações em Massa */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={aptosTurma === 0}
                  onClick={handleToggleSelectAllAptos}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold font-body transition-colors disabled:opacity-50"
                >
                  {aptosTurma > 0 && selectedEnrollmentIds.length === aptosTurma
                    ? "DESMARCAR TODOS"
                    : `SELECIONAR TODOS OS APTOS (${aptosTurma})`}
                </button>

                <button
                  type="button"
                  disabled={batchLoading || selectedEnrollmentIds.length === 0}
                  onClick={handleEmitirLote}
                  className="px-6 py-3 bg-[#004aad] hover:bg-[#003882] disabled:opacity-50 text-white rounded-xl text-xs font-bold font-body transition-colors shadow-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {batchLoading
                      ? "EMITINDO EM LOTE..."
                      : `EMITIR CERTIFICADOS (${selectedEnrollmentIds.length})`}
                  </span>
                </button>

                {emitidosTurma > 0 && (
                  <button
                    type="button"
                    disabled={zipLoading}
                    onClick={handleDownloadZip}
                    className="px-4 py-3 bg-[#d4ed31] hover:bg-[#c2d929] text-[#004aad] rounded-xl text-xs font-bold font-body transition-colors flex items-center gap-2 shadow-sm"
                    title="Baixar todos os certificados desta turma em um único arquivo compactado ZIP"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>{zipLoading ? "GERANDO ZIP..." : "BAIXAR TURMA EM ZIP"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cards de Métricas da Turma */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase font-body">Total Alunos</span>
                <p className="text-2xl font-heading text-slate-800 mt-1">{totalAlunosTurma}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <span className="text-xs font-semibold text-emerald-600 uppercase font-body">Aptos p/ Emissão</span>
                <p className="text-2xl font-heading text-emerald-700 mt-1">{aptosTurma}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <span className="text-xs font-semibold text-[#004aad] uppercase font-body">Já Emitidos</span>
                <p className="text-2xl font-heading text-[#004aad] mt-1">{emitidosTurma}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <span className="text-xs font-semibold text-amber-700 uppercase font-body">Pendentes</span>
                <p className="text-2xl font-heading text-amber-800 mt-1">{pendentesTurma}</p>
              </div>
            </div>
          </div>

          {/* Checklist de Candidatos */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-[#f8fafc] grid grid-cols-12 p-4 border-b border-slate-100 font-body font-bold text-slate-500 text-xs uppercase tracking-wider items-center">
              <div className="col-span-1 text-center">
                <input
                  type="checkbox"
                  aria-label="Selecionar todos os alunos aptos"
                  disabled={aptosTurma === 0}
                  checked={aptosTurma > 0 && selectedEnrollmentIds.length === aptosTurma}
                  onChange={handleToggleSelectAllAptos}
                  className="w-4 h-4 rounded text-[#004aad] focus:ring-[#38b6ff] cursor-pointer"
                />
              </div>
              <div className="col-span-4">Aluno / CPF</div>
              <div className="col-span-3">Status Matrícula</div>
              <div className="col-span-2">Certificado</div>
              <div className="col-span-2 text-right">Ação</div>
            </div>

            {loadingCandidates ? (
              <div className="p-12 text-center text-[#004aad] font-body font-semibold">
                <div className="w-8 h-8 border-4 border-[#38b6ff] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                Carregando alunos da turma...
              </div>
            ) : candidates.length === 0 ? (
              <EmptyState message="Nenhum aluno matriculado nesta turma." />
            ) : (
              <div className="divide-y divide-slate-100 font-body text-sm">
                {candidates.map((cand) => {
                  const isSelected = selectedEnrollmentIds.includes(cand.enrollment_id);

                  return (
                    <div
                      key={cand.enrollment_id}
                      className={`grid grid-cols-12 p-4 items-center transition-colors ${
                        isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="col-span-1 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Selecionar certificado de ${cand.student_name}`}
                          disabled={!cand.can_issue}
                          checked={isSelected}
                          onChange={() => handleToggleStudent(cand.enrollment_id)}
                          className="w-4 h-4 rounded text-[#004aad] focus:ring-[#38b6ff] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        />
                      </div>

                      {/* Dados Aluno */}
                      <div className="col-span-4">
                        <p className="font-bold text-[#004aad]">{cand.student_name}</p>
                        <p className="text-xs text-slate-400 font-mono">
                          CPF: {formatCpf(cand.student_cpf || "")}
                        </p>
                      </div>

                      {/* Status Matrícula */}
                      <div className="col-span-3">
                        {cand.is_completed ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Concluído
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                            Pendente ({cand.enrollment_status})
                          </span>
                        )}
                      </div>

                      {/* Status do Certificado */}
                      <div className="col-span-2">
                        {cand.has_certificate ? (
                          <div>
                            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700">
                              {cand.certificate_uuid}
                            </span>
                          </div>
                        ) : cand.can_issue ? (
                          <span className="text-xs font-semibold text-emerald-600">Apto p/ emissão</span>
                        ) : (
                          <span className="text-xs text-slate-400">Não elegível</span>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="col-span-2 text-right">
                        {cand.has_certificate && cand.certificate_uuid ? (
                          <button
                            onClick={() => handleDownload(cand.certificate_uuid!)}
                            className="text-xs font-bold text-[#38b6ff] hover:text-[#004aad] inline-flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Baixar PDF
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300 font-medium">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 2: HISTÓRICO GERAL & EMISSÃO INDIVIDUAL               */}
      {/* ======================================================== */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <PageHeader
            title="Todos os Certificados Emitidos"
            description="Consulta de certificados já gerados no sistema."
            search={searchTerm}
            searchPlaceholder="Buscar por código, aluno ou turma..."
            onSearch={setSearchTerm}
            actionLabel="EMISSÃO INDIVIDUAL AVULSA"
            actionClassName="bg-[#004aad] hover:bg-[#003882] text-white font-heading px-6 py-3 rounded-lg shadow-sm whitespace-nowrap text-xs font-bold"
            onAction={() => setIsModalOpen(true)}
          />

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden font-body">
            <div className="bg-[#f8fafc] grid grid-cols-6 p-4 border-b border-slate-100 font-bold text-slate-500 text-xs uppercase tracking-wider">
              <div className="col-span-2">Aluno / Curso</div>
              <div>Turma</div>
              <div>Código Único</div>
              <div>Emissão</div>
              <div className="text-right">Ação</div>
            </div>

            {filteredHistory.length === 0 ? (
              <EmptyState message="Nenhum certificado encontrado." />
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredHistory.map((cert) => (
                  <div
                    key={cert.id}
                    className="grid grid-cols-6 p-4 items-center hover:bg-slate-50 transition-colors text-slate-700 text-sm"
                  >
                    <div className="col-span-2 font-bold text-[#004aad]">
                      {cert.snapshot_data.aluno_nome}
                      <span className="block text-xs text-slate-500 font-medium mt-0.5">
                        {cert.snapshot_data.curso_nome} ({cert.snapshot_data.carga_horaria}h)
                      </span>
                    </div>
                    <div className="text-slate-600 font-medium text-xs">
                      {cert.snapshot_data.turma_codigo || "—"}
                    </div>
                    <div className="text-slate-700 font-mono text-xs font-bold">
                      {cert.uuid_code}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(cert.issued_at).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => handleDownload(cert.uuid_code)}
                        className="text-[#38b6ff] hover:text-[#004aad] font-bold text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Baixar PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Emissão Individual de Emergência */}
      {isModalOpen && (
        <Modal title="Emissão Individual Avulsa" onClose={() => setIsModalOpen(false)} maxWidth="max-w-sm">
          <form onSubmit={handleEmitirIndividual} className="p-6 space-y-4 font-body">
            <div>
              <label className="block text-sm font-semibold text-[#004aad] mb-1">
                Número da Matrícula (ID)
              </label>
              <input
                type="text"
                required
                value={matriculaId}
                onChange={(e) => setMatriculaId(e.target.value)}
                placeholder="Ex: 15 ou MAT-00015"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#38b6ff]"
              />
              <p className="text-xs text-slate-400 mt-2 text-justify">
                Insira o ID da matrícula. O sistema validará se o aluno concluiu as aulas e se o financeiro está quitado.
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-lg text-sm hover:bg-slate-200 transition-colors"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={loadingIndividual}
                className="flex-1 bg-[#004aad] hover:bg-[#003882] text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {loadingIndividual ? "VALIDANDO..." : "EMITIR"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}