"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Pencil, Trash2 } from 'lucide-react';

// Esquema de validação para o formulário do diário
const diaryEntrySchema = z.object({
  id: z.string().optional(), // Adicionado para edição
  entry_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  mood: z.string().min(1, { message: "Humor é obrigatório" }),
  behavior_observations: z.string().optional(),
  medication_taken: z.enum(["sim", "nao", "nao_aplica"]), 
  medication_details: z.string().optional(),
  activities_highlights: z.string().optional(),
  parent_observations: z.string().min(1, { message: "Observações dos pais são obrigatórias" }),
});

type DiaryEntryFormValues = z.infer<typeof diaryEntrySchema>;

interface DiaryEntry extends DiaryEntryFormValues {
  id: string; // ID é obrigatório para a interface de entrada, opcional no schema para criação
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
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const form = useForm<DiaryEntryFormValues>({
    resolver: zodResolver(diaryEntrySchema),
    defaultValues: {
      entry_date: new Date().toISOString().split("T")[0],
      mood: "",
      behavior_observations: "",
      medication_taken: "nao_aplica",
      medication_details: "",
      activities_highlights: "",
      parent_observations: "",
    },
  });

  const editForm = useForm<DiaryEntryFormValues>({
    resolver: zodResolver(diaryEntrySchema),
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
      setEntries(data as DiaryEntry[] || []);
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
      toast({ title: "Erro", description: "Usuário ou perfil da criança não selecionado.", variant: "destructive" });
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
      toast({ title: "Sucesso!", description: "Entrada do diário salva com sucesso." });
      form.reset({
        entry_date: new Date().toISOString().split("T")[0],
        mood: "",
        behavior_observations: "",
        medication_taken: "nao_aplica",
        medication_details: "",
        activities_highlights: "",
        parent_observations: "",
      });
      fetchEntries(); 
    } catch (error: any) {
      console.error("Erro ao salvar entrada do diário:", error);
      toast({ title: "Erro ao salvar entrada", description: error.message || "Não foi possível salvar a entrada.", variant: "destructive" });
    }
    setIsSubmitting(false);
  }

  async function onEditSubmit(values: DiaryEntryFormValues) {
    if (!editingEntry || !user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("diary_entries")
        .update({
          entry_date: values.entry_date,
          mood: values.mood,
          behavior_observations: values.behavior_observations,
          medication_taken: values.medication_taken,
          medication_details: values.medication_details,
          activities_highlights: values.activities_highlights,
          parent_observations: values.parent_observations,
        })
        .eq("id", editingEntry.id)
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Sucesso!", description: "Entrada do diário atualizada com sucesso." });
      setIsEditDialogOpen(false);
      setEditingEntry(null);
      fetchEntries();
    } catch (error: any) {
      console.error("Erro ao atualizar entrada:", error);
      toast({ title: "Erro ao atualizar", description: error.message || "Não foi possível atualizar a entrada.", variant: "destructive" });
    }
    setIsSubmitting(false);
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("diary_entries")
        .delete()
        .eq("id", entryId)
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Sucesso!", description: "Entrada do diário excluída com sucesso." });
      fetchEntries();
    } catch (error: any) {
      console.error("Erro ao excluir entrada:", error);
      toast({ title: "Erro ao excluir", description: error.message || "Não foi possível excluir a entrada.", variant: "destructive" });
    }
  };

  const openEditModal = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    editForm.reset({
        id: entry.id,
        entry_date: entry.entry_date,
        mood: entry.mood,
        behavior_observations: entry.behavior_observations || "",
        medication_taken: entry.medication_taken,
        medication_details: entry.medication_details || "",
        activities_highlights: entry.activities_highlights || "",
        parent_observations: entry.parent_observations,
    });
    setIsEditDialogOpen(true);
  };

  const selectedProfile = childrenProfiles.find(p => p.child_id === selectedChildId);

  if (!selectedChildId) {
    return (
      <div className="p-4 md:p-6">
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
      {/* Formulário de Nova Entrada */}
      <Card>
        <CardHeader>
          <CardTitle>Novo Registro no Diário - {selectedProfile?.nome_crianca || "Criança"}</CardTitle>
          <CardDescription>Adicione uma nova entrada sobre o dia da criança.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Campos do formulário (mantidos como antes) */}
              <FormField control={form.control} name="entry_date" render={({ field }) => (<FormItem><FormLabel>Data</FormLabel><FormControl><Input type="date" {...field} className="dark:bg-gray-700 dark:text-white dark:border-gray-600" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="mood" render={({ field }) => (<FormItem><FormLabel>Humor</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600"><SelectValue placeholder="Selecione o humor" /></SelectTrigger></FormControl><SelectContent className="dark:bg-gray-800 dark:text-white"><SelectItem value="feliz">Feliz</SelectItem><SelectItem value="calmo">Calmo</SelectItem><SelectItem value="ansioso">Ansioso(a)</SelectItem><SelectItem value="irritado">Irritado(a)</SelectItem><SelectItem value="triste">Triste</SelectItem><SelectItem value="agitado">Agitado(a)</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="parent_observations" render={({ field }) => (<FormItem><FormLabel>Observações Principais</FormLabel><FormControl><Textarea placeholder="Como foi o dia? Comportamentos, interações..." {...field} className="dark:bg-gray-700 dark:text-white dark:border-gray-600" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="medication_taken" render={({ field }) => (<FormItem><FormLabel>Medicação Administrada?</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent className="dark:bg-gray-800 dark:text-white"><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem><SelectItem value="nao_aplica">Não se aplica</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              {form.watch("medication_taken") === "sim" && <FormField control={form.control} name="medication_details" render={({ field }) => (<FormItem><FormLabel>Detalhes da Medicação</FormLabel><FormControl><Input placeholder="Horário, dose, observações" {...field} className="dark:bg-gray-700 dark:text-white dark:border-gray-600" /></FormControl><FormMessage /></FormItem>)} />}
              <FormField control={form.control} name="behavior_observations" render={({ field }) => (<FormItem><FormLabel>Comportamentos Específicos (Opcional)</FormLabel><FormControl><Textarea placeholder="Crises, foco intenso, dificuldades" {...field} className="dark:bg-gray-700 dark:text-white dark:border-gray-600" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="activities_highlights" render={({ field }) => (<FormItem><FormLabel>Destaques (Atividades, Alimentação - Opcional)</FormLabel><FormControl><Textarea placeholder="Brincou de..., comeu bem, tarefa X" {...field} className="dark:bg-gray-700 dark:text-white dark:border-gray-600" /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">{isSubmitting ? "Salvando..." : "Salvar Novo Registro"}</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Histórico de Registros */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Registros - {selectedProfile?.nome_crianca || "Criança"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingEntries && <p className="text-center py-4">Carregando registros...</p>}
          {!isLoadingEntries && entries.length === 0 && (
            <p className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhum registro encontrado para este perfil.</p>
          )}
          {!isLoadingEntries && entries.length > 0 && (
            <div className="space-y-4">
              {entries.map((entry) => (
                <Card key={entry.id} className="dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg">Registro de {new Date(entry.entry_date + 'T00:00:00').toLocaleDateString('pt-BR')}</CardTitle>
                            <CardDescription>Humor: <span className="font-semibold">{entry.mood}</span></CardDescription>
                        </div>
                        <div className="flex space-x-2">
                            <Dialog open={isEditDialogOpen && editingEntry?.id === entry.id} onOpenChange={(isOpen) => { if(!isOpen) setEditingEntry(null); setIsEditDialogOpen(isOpen);}}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => openEditModal(entry)} className="dark:hover:bg-gray-700">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[625px] dark:bg-gray-900">
                                    <DialogHeader>
                                    <DialogTitle>Editar Registro do Diário</DialogTitle>
                                    <DialogDescription>
                                        Modifique os campos abaixo e clique em salvar.
                                    </DialogDescription>
                                    </DialogHeader>
                                    <Form {...editForm}>
                                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                                            <FormField control={editForm.control} name="entry_date" render={({ field }) => (<FormItem><FormLabel>Data</FormLabel><FormControl><Input type="date" {...field} className="dark:bg-gray-800 dark:text-white dark:border-gray-700" /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={editForm.control} name="mood" render={({ field }) => (<FormItem><FormLabel>Humor</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="dark:bg-gray-800 dark:text-white dark:border-gray-700"><SelectValue placeholder="Selecione o humor" /></SelectTrigger></FormControl><SelectContent className="dark:bg-gray-700 dark:text-white"><SelectItem value="feliz">Feliz</SelectItem><SelectItem value="calmo">Calmo</SelectItem><SelectItem value="ansioso">Ansioso(a)</SelectItem><SelectItem value="irritado">Irritado(a)</SelectItem><SelectItem value="triste">Triste</SelectItem><SelectItem value="agitado">Agitado(a)</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                            <FormField control={editForm.control} name="parent_observations" render={({ field }) => (<FormItem><FormLabel>Observações Principais</FormLabel><FormControl><Textarea {...field} className="dark:bg-gray-800 dark:text-white dark:border-gray-700" /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={editForm.control} name="medication_taken" render={({ field }) => (<FormItem><FormLabel>Medicação Administrada?</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="dark:bg-gray-800 dark:text-white dark:border-gray-700"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent className="dark:bg-gray-700 dark:text-white"><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem><SelectItem value="nao_aplica">Não se aplica</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                            {editForm.watch("medication_taken") === "sim" && <FormField control={editForm.control} name="medication_details" render={({ field }) => (<FormItem><FormLabel>Detalhes da Medicação</FormLabel><FormControl><Input {...field} className="dark:bg-gray-800 dark:text-white dark:border-gray-700" /></FormControl><FormMessage /></FormItem>)} />}
                                            <FormField control={editForm.control} name="behavior_observations" render={({ field }) => (<FormItem><FormLabel>Comportamentos Específicos</FormLabel><FormControl><Textarea {...field} className="dark:bg-gray-800 dark:text-white dark:border-gray-700" /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={editForm.control} name="activities_highlights" render={({ field }) => (<FormItem><FormLabel>Destaques (Atividades, Alimentação)</FormLabel><FormControl><Textarea {...field} className="dark:bg-gray-800 dark:text-white dark:border-gray-700" /></FormControl><FormMessage /></FormItem>)} />
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button type="button" variant="outline" className="dark:hover:bg-gray-700">Cancelar</Button>
                                                </DialogClose>
                                                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar Alterações"}</Button>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="dark:bg-gray-900">
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Tem certeza que deseja excluir este registro do diário? Esta ação não poderá ser desfeita.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel className="dark:hover:bg-gray-700">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteEntry(entry.id)} className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800">Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Observações dos Pais:</p>
                    <p className="text-sm mb-3 whitespace-pre-wrap text-gray-600 dark:text-gray-400">{entry.parent_observations}</p>
                    
                    {entry.behavior_observations && (
                      <>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Comportamentos Específicos:</p>
                        <p className="text-sm mb-3 whitespace-pre-wrap text-gray-600 dark:text-gray-400">{entry.behavior_observations}</p>
                      </>
                    )}
                    {entry.activities_highlights && (
                       <>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Destaques de Atividades/Alimentação:</p>
                        <p className="text-sm mb-3 whitespace-pre-wrap text-gray-600 dark:text-gray-400">{entry.activities_highlights}</p>
                      </>
                    )}
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Medicação Administrada:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {entry.medication_taken === "sim" ? "Sim" : entry.medication_taken === "nao" ? "Não" : "Não se aplica"}
                      {entry.medication_taken === "sim" && entry.medication_details && ` (${entry.medication_details})`}
                    </p>
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

