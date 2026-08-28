"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // O FastAPI (OAuth2) exige que os dados sejam enviados como Formulário (URL Encoded)
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Salva a chave de segurança no navegador
        localStorage.setItem("closevets_token", data.access_token);
        // Redireciona para o painel de controle (que criaremos a seguir)
        router.push("/dashboard");
      } else {
        setError("E-mail ou senha incorretos.");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        
        <div className="bg-[#004aad] p-8 text-center">
          <h1 className="font-heading text-4xl text-white uppercase tracking-wide">
            CloseVets
          </h1>
          <p className="font-body text-[#38b6ff] mt-2 font-semibold">
            Gestão de Cursos Livres
          </p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 font-body p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block font-body text-sm font-semibold text-[#004aad] mb-2">E-mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#38b6ff] text-slate-800"
              placeholder="coordenacao@closevets.com.br"
            />
          </div>
          
          <div>
            <label className="block font-body text-sm font-semibold text-[#004aad] mb-2">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#38b6ff] text-slate-800"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#d4ed31] hover:bg-[#c2d929] disabled:opacity-50 text-[#004aad] font-heading text-xl py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>{loading ? "CONECTANDO..." : "ENTRAR NO SISTEMA"}</span>
          </button>
        </form>

      </div>
    </main>
  );
}