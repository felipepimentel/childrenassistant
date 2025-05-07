"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function CadastroPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nome, setNome] = useState(""); // Campo adicional para nome
  const { signUpWithPassword, isLoading, error, user, clearError } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard"); // Redireciona para o dashboard se já estiver logado
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    if (password !== confirmPassword) {
      // Idealmente, use o store para mostrar este erro ou um estado local
      alert("As senhas não coincidem!");
      return;
    }
    await signUpWithPassword(email, password, { nome_completo: nome }); // Passando nome como metadata
    // Após o cadastro, o Supabase pode enviar um email de confirmação.
    // O usuário pode ser redirecionado para uma página de "verifique seu email" ou para o login.
    // Por enquanto, vamos apenas limpar o formulário ou mostrar uma mensagem.
    // Se o signUp bem-sucedido já logar o usuário (depende da config do Supabase), o useEffect cuidará do redirect.
    // Se não, pode ser útil redirecionar para /login ou uma página de sucesso.
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Criar Conta</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Preencha os campos abaixo para se registrar.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</Label>
            <Input
              id="nome"
              name="nome"
              type="text"
              autoComplete="name"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-500 dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-500 dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-500 dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-500 dark:text-white"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">Erro: {error.message}</p>
          )}

          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}

