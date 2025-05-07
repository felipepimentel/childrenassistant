"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { PlusCircle } from 'lucide-react';

// TODO: Definir interfaces para Tarefa (Task) e Rotina (Routine)
interface Task {
  id: string;
  routine_id: string;
  user_id: string;
  child_id: string;
  description: string;
  is_completed: boolean;
  order: number;
  created_at?: string;
  // Adicionar mais campos conforme necessário (ex: hora, dia da semana, ícone)
}

interface Routine {
  id: string;
  user_id: string;
  child_id: string;
  name: string; // Ex: "Rotina da Manhã", "Rotina da Noite"
  tasks: Task[];
  created_at?: string;
}

export default function RotinaPage() {
  const { user } = useAuthStore();
  const { selectedChildId, childrenProfiles } = useProfileStore();
  const [routines, setRoutines] = useState<Routine[]>([]); // Por enquanto, vamos focar em uma lista de tarefas, não múltiplas rotinas
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Implementar formulário para adicionar/editar tarefas e rotinas
  // TODO: Implementar lógica de arrastar e soltar para reordenar tarefas
  // TODO: Implementar funcionalidade para marcar tarefas como concluídas

  const fetchTasks = async () => {
    if (!user || !selectedChildId) return;
    setIsLoading(true);
    try {
      // Por enquanto, vamos buscar tarefas diretamente, sem agrupar por rotina específica
      // Idealmente, teríamos uma tabela 'routines' e 'tasks' relacionadas
      const { data, error } = await supabase
        .from("routine_tasks") // Supondo uma tabela 'routine_tasks'
        .select("*")
        .eq("user_id", user.id)
        .eq("child_id", selectedChildId)
        .order("order", { ascending: true });

      if (error) throw error;
      setTasks(data as Task[] || []);
    } catch (error: any) {
      console.error("Erro ao buscar tarefas da rotina:", error);
      // toast({ title: "Erro ao buscar tarefas", description: error.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user && selectedChildId) {
      fetchTasks();
    }
  }, [user, selectedChildId]);

  const selectedProfile = childrenProfiles.find(p => p.child_id === selectedChildId);

  if (!selectedChildId) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Quadro de Rotina</CardTitle>
            <CardDescription>Selecione um perfil de criança no Dashboard para visualizar ou gerenciar a rotina.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 md:p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Quadro de Rotina - {selectedProfile?.nome_crianca || "Criança"}</CardTitle>
            <CardDescription>Organize as tarefas e atividades diárias.</CardDescription>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Tarefa
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-center py-4">Carregando rotina...</p>}
          {!isLoading && tasks.length === 0 && (
            <p className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhuma tarefa encontrada para esta rotina. Comece adicionando uma!</p>
          )}
          {!isLoading && tasks.length > 0 && (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card key={task.id} className="dark:bg-gray-800 flex items-center justify-between p-4 shadow-sm">
                  <p className={task.is_completed ? "line-through text-gray-500 dark:text-gray-400" : ""}>{task.description}</p>
                  {/* TODO: Adicionar botões de ação (concluir, editar, excluir) e drag handle */}
                  <Button variant={task.is_completed ? "outline" : "default"} size="sm">
                    {task.is_completed ? "Desfazer" : "Concluir"}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* TODO: Adicionar modal/dialog para adicionar/editar tarefas */}
    </div>
  );
}

