"use client";

import AppLayout from "@/app/(app)/layout"; // O layout já é aplicado via estrutura de pastas
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";
import { supabase } from "@/lib/supabaseClient"; // Importa o cliente Supabase
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast"; // Supondo que você tenha use-toast de shadcn

// Esquema de validação para o formulário do diário
const diaryEntrySchema = z.object({
  entry_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  mood: z.string().min(1, { message: "Humor é obrigatório" }),
  behavior_observations: z.string().optional(),
  medication_taken: z.enum(["sim", "nao", "nao_aplica"]), // sim, nao, nao_aplica
  medication_details: z.string().optional(),
  activities_highlights: z.string().optional(),
  parent_observations: z.string().min(1, { message: "Observações dos pais são obrigatórias" }),
});

type DiaryEntryFormValues = z.infer<typeof diaryEntrySchema>;

interface DiaryEntry extends DiaryEntryFormValues {
  id?: string;
  child_id: string;
  user_id: string;
  created_at?: string;
}

export default function DiarioPage() {
  const { user } = useAuthStore();
  const { selectedChildId, childrenProfiles } = useProfileStore();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DiaryEntryFormValues>({
    resolver: zodResolver(diaryEntrySchema),
    defaultValues: {
      entry_date: new Date().toISOString().split("T")[0], // Data atual por padrão
      mood: "",
      behavior_observations: "",
      medication_taken: "nao_aplica",
      medication_details: "",
      activities_highlights: "",
      parent_observations: "",
    },
  });

  const fetchEntries = async () => {
    if (!user || !selectedChildId) return;
    setIsLoadingEntries(true);
    try {
      const { data, error } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("child_id", selectedChildId)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar entradas do diário:", error);
      toast({
        title: "Erro ao buscar entradas",
        description: error.message || "Não foi possível carregar as entradas do diário.",
        variant: "destructive",
      });
    }
    setIsLoadingEntries(false);
  };

  useEffect(() => {
    if (user && selectedChildId) {
      fetchEntries();
    }
  }, [user, selectedChildId]);

  async function onSubmit(values: DiaryEntryFormValues) {
    if (!user || !selectedChildId) {
      toast({
        title: "Erro",
        description: "Usuário ou perfil da criança não selecionado.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("diary_entries").insert([
        {
          ...values,
          child_id: selectedChildId,
          user_id: user.id,
        },
      ]);
      if (error) throw error;
      toast({
        title: "Sucesso!",
        description: "Entrada do diário salva com sucesso.",
      });
      form.reset();
      fetchEntries(); // Atualiza a lista de entradas
    } catch (error: any) {
      console.error("Erro ao salvar entrada do diário:", error);
      toast({
        title: "Erro ao salvar entrada",
        description: error.message || "Não foi possível salvar a entrada do diário.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  const selectedProfile = childrenProfiles.find(p => p.child_id === selectedChildId);

  if (!selectedChildId) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Diário de Bordo</CardTitle>
            <CardDescription>Selecione um perfil de criança no Dashboard para visualizar ou adicionar entradas no diário.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo Registro no Diário - {selectedProfile?.nome_crianca || "Criança"}</CardTitle>
          <CardDescription>Adicione uma nova entrada sobre o dia da criança.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="entry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Registro</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="dark:bg-gray-800 dark:text-white dark:border-gray-600" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Humor Geral da Criança</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="dark:bg-gray-800 dark:text-white dark:border-gray-600">
                          <SelectValue placeholder="Selecione o humor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-800 dark:text-white">
                        <SelectItem value="feliz">Feliz</SelectItem>
                        <SelectItem value="calmo">Calmo</SelectItem>
                        <SelectItem value="ansioso">Ansioso(a)</SelectItem>
                        <SelectItem value="irritado">Irritado(a)</SelectItem>
                        <SelectItem value="triste">Triste</SelectItem>
                        <SelectItem value="agitado">Agitado(a)</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parent_observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações dos Pais/Responsáveis</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descreva como foi o dia, comportamentos importantes, interações, etc." {...field} className="dark:bg-gray-800 dark:text-white dark:border-gray-600" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="medication_taken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medicação Administrada?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="dark:bg-gray-800 dark:text-white dark:border-gray-600">
                          <SelectValue placeholder="Selecione uma opção" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-800 dark:text-white">
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                        <SelectItem value="nao_aplica">Não se aplica hoje</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("medication_taken") === "sim" && (
                <FormField
                  control={form.control}
                  name="medication_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detalhes da Medicação (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Horário, dose, alguma observação" {...field} className="dark:bg-gray-800 dark:text-white dark:border-gray-600" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="behavior_observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações de Comportamento Específicas (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Crises, momentos de foco intenso, dificuldades específicas" {...field} className="dark:bg-gray-800 dark:text-white dark:border-gray-600" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activities_highlights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destaques de Atividades / Alimentação (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Brincou de..., comeu bem no almoço, dificuldade com tarefa X" {...field} className="dark:bg-gray-800 dark:text-white dark:border-gray-600" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                {isSubmitting ? "Salvando..." : "Salvar Registro"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Registros - {selectedProfile?.nome_crianca || "Criança"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingEntries && <p>Carregando registros...</p>}
          {!isLoadingEntries && entries.length === 0 && (
            <p>Nenhum registro encontrado para este perfil.</p>
          )}
          {!isLoadingEntries && entries.length > 0 && (
            <div className="space-y-4">
              {entries.map((entry) => (
                <Card key={entry.id} className="dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle>Registro de {new Date(entry.entry_date + 'T00:00:00').toLocaleDateString()}</CardTitle> {/* Ajuste para evitar problemas de fuso */} 
                    <CardDescription>Humor: {entry.mood}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-semibold">Observações dos Pais:</p>
                    <p className="text-sm mb-2 whitespace-pre-wrap">{entry.parent_observations}</p>
                    
                    {entry.behavior_observations && (
                      <>
                        <p className="text-sm font-semibold mt-2">Comportamentos Específicos:</p>
                        <p className="text-sm mb-2 whitespace-pre-wrap">{entry.behavior_observations}</p>
                      </>
                    )}
                    {entry.activities_highlights && (
                       <>
                        <p className="text-sm font-semibold mt-2">Destaques de Atividades/Alimentação:</p>
                        <p className="text-sm mb-2 whitespace-pre-wrap">{entry.activities_highlights}</p>
                      </>
                    )}
                    <p className="text-sm font-semibold mt-2">Medicação Administrada:</p>
                    <p className="text-sm mb-2">
                      {entry.medication_taken === "sim" ? "Sim" : entry.medication_taken === "nao" ? "Não" : "Não se aplica"}
                      {entry.medication_taken === "sim" && entry.medication_details && ` (${entry.medication_details})`}
                    </p>
                    {/* Adicionar botões de editar/excluir aqui se necessário */}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

