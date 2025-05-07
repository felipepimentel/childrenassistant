"use client";

import AppLayout from "@/app/(app)/layout"; // Ajuste o caminho se necessário
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";
import Link from "next/link";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { childrenProfiles, fetchChildrenProfiles, isLoading: profilesLoading, selectedChildId, setSelectedChildId } = useProfileStore();

  useEffect(() => {
    // Carrega os perfis das crianças quando o componente é montado e o usuário está logado
    if (user) {
      fetchChildrenProfiles();
    }
  }, [user, fetchChildrenProfiles]);

  const selectedProfile = childrenProfiles.find(p => p.child_id === selectedChildId);

  return (
    // O AppLayout já é aplicado pela estrutura de rotas (app/(app)/layout.tsx)
    // Não é necessário envolvê-lo aqui novamente.
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Olá, {user?.user_metadata?.nome_completo || user?.email || "Usuário"}!
          </h1>
          <p className="mt-1 text-md text-gray-600 dark:text-gray-400">
            Bem-vindo(a) de volta ao TDAH Companheiro.
          </p>
        </div>
        {childrenProfiles.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Visualizando para:</span>
            <select 
              value={selectedChildId || ""}
              onChange={(e) => setSelectedChildId(e.target.value || null)}
              className="p-2 border rounded-md bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {childrenProfiles.map(child => (
                <option key={child.child_id} value={child.child_id}>
                  {child.nome_crianca}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {profilesLoading && <p className="text-gray-600 dark:text-gray-400">Carregando perfis...</p>}

      {!profilesLoading && childrenProfiles.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum Perfil de Criança Encontrado</CardTitle>
            <CardDescription>
              Parece que você ainda não adicionou nenhum perfil de criança. Adicione um para começar a usar os recursos do aplicativo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/perfil-familiar">Adicionar Perfil da Criança</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedProfile && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resumo Rápido para {selectedProfile.nome_crianca}</CardTitle>
            <CardDescription>Acompanhe as atividades e o bem-estar.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Diário de Bordo</CardTitle>
                <CardDescription>Últimos registros e humor.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Nenhum registro recente.</p>
                <Button asChild variant="outline">
                  <Link href="/diario">Ver Diário</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quadro de Rotina</CardTitle>
                <CardDescription>Tarefas de hoje.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Nenhuma tarefa para hoje.</p>
                <Button asChild variant="outline">
                  <Link href="/rotina">Ver Rotina</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Lembretes</CardTitle>
                <CardDescription>Próximos lembretes.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Nenhum lembrete ativo.</p>
                <Button asChild variant="outline">
                  <Link href="/lembretes">Ver Lembretes</Link>
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Outras seções do Dashboard podem ser adicionadas aqui */}
      {/* Ex: Gráficos de progresso, artigos recentes da biblioteca, etc. */}

    </div>
  );
}

