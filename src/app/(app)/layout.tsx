"use client";

import Sidebar from "@/components/layouts/Sidebar";
import Header from "@/components/layouts/Header";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, listenToAuthChanges, session } = useAuthStore();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const authSub = listenToAuthChanges();
    // No Next.js 13+ com App Router, a subscrição deve ser gerenciada adequadamente.
    // A chamada inicial para getSession já está no authStore.
    return () => {
      if (authSub && authSub.data && typeof authSub.data.subscription?.unsubscribe === 'function') {
        authSub.data.subscription.unsubscribe();
      }
    };
  }, [listenToAuthChanges]);

  useEffect(() => {
    // Este useEffect agora espera o isLoading do authStore se tornar false
    // antes de verificar o usuário e redirecionar.
    if (!isLoading) {
      if (!user && !session) {
        router.push("/login");
      } else {
        setAuthChecked(true); // Permite a renderização do conteúdo protegido
      }
    }
  }, [user, session, isLoading, router]);

  if (isLoading || !authChecked) {
    // Pode-se adicionar um spinner de carregamento mais elaborado aqui
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Carregando aplicação...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-950 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

