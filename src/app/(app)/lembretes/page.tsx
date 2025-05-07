"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { PlusCircle, BellRing, Edit, Trash2 } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

// TODO: Definir interface para Lembrete (Reminder)
interface Reminder {
  id: string;
  user_id: string;
  child_id: string;
  title: string;
  description?: string;
  reminder_time: string; // ISO string for date and time
  type: 'medication' | 'appointment' | 'activity' | 'other'; // Tipo de lembrete
  is_completed: boolean;
  created_at?: string;
  // Adicionar campos como recorrência, notificações, etc.
}

export default function LembretesPage() {
  const { user } = useAuthStore();
  const { selectedChildId, childrenProfiles } = useProfileStore();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Implementar formulário para adicionar/editar lembretes (usar Dialog)
  // TODO: Implementar funcionalidade para marcar lembretes como concluídos
  // TODO: Considerar visualização em calendário ou agrupamento por data

  const fetchReminders = async () => {
    if (!user || !selectedChildId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("reminders") // Supondo uma tabela 'reminders'
        .select("*")
        .eq("user_id", user.id)
        .eq("child_id", selectedChildId)
        .order("reminder_time", { ascending: true });

      if (error) throw error;
      setReminders(data as Reminder[] || []);
    } catch (error: any) {
      console.error("Erro ao buscar lembretes:", error);
      toast({ title: "Erro ao buscar lembretes", description: error.message || "Não foi possível carregar os lembretes.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user && selectedChildId) {
      fetchReminders();
    }
  }, [user, selectedChildId]);

  const selectedProfile = childrenProfiles.find(p => p.child_id === selectedChildId);

  if (!selectedChildId) {
    return (
      <div className="p-4 md:p-6">
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Lembretes</CardTitle>
            <CardDescription>Selecione um perfil de criança no Dashboard para visualizar ou gerenciar os lembretes.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 md:p-6">
      <Card className="dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lembretes - {selectedProfile?.nome_crianca || "Criança"}</CardTitle>
            <CardDescription>Gerencie os lembretes de consultas, medicações e atividades.</CardDescription>
          </div>
          {/* TODO: Adicionar botão para abrir modal de novo lembrete */}
          <Button className="dark:bg-blue-600 dark:hover:bg-blue-700">
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Lembrete
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-center py-4">Carregando lembretes...</p>}
          {!isLoading && reminders.length === 0 && (
            <p className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhum lembrete encontrado. Adicione o primeiro!</p>
          )}
          {!isLoading && reminders.length > 0 && (
            <div className="space-y-4">
              {reminders.map((reminder) => (
                <Card key={reminder.id} className={`dark:bg-gray-700 shadow-sm ${reminder.is_completed ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <BellRing className="mr-2 h-5 w-5 text-yellow-400" /> 
                        {reminder.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-400 dark:text-gray-300">
                        {new Date(reminder.reminder_time).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' - '}<span className="capitalize font-medium">{reminder.type}</span>
                      </CardDescription>
                    </div>
                     {/* TODO: Adicionar botões de ação (concluir, editar, excluir) */}
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="icon" className="dark:hover:bg-gray-600 h-8 w-8">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </CardHeader>
                  {reminder.description && (
                    <CardContent className="pt-0 pb-3">
                      <p className="text-sm text-gray-300 dark:text-gray-200">{reminder.description}</p>
                    </CardContent>
                  )}
                  {/* TODO: Adicionar botão para marcar como concluído/pendente */}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* TODO: Adicionar modal/dialog para adicionar/editar lembretes */}
    </div>
  );
}

