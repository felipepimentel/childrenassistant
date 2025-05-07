"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
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
import { PlusCircle, BellRing, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";

// Esquema de validação para o formulário de lembrete
const reminderSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { message: "Título é obrigatório" }),
  description: z.string().optional(),
  reminder_time_date: z.date({ required_error: "Data é obrigatória" }),
  reminder_time_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Hora inválida (HH:MM)"}),
  type: z.enum(["medication", "appointment", "activity", "other"], { required_error: "Tipo é obrigatório" }),
});

type ReminderFormValues = z.infer<typeof reminderSchema>;

interface Reminder {
  id: string;
  user_id: string;
  child_id: string;
  title: string;
  description?: string;
  reminder_time: string; // ISO string
  type: "medication" | "appointment" | "activity" | "other";
  is_completed: boolean;
  created_at?: string;
}

export default function LembretesPage() {
  const { user } = useAuthStore();
  const { selectedChildId, childrenProfiles } = useProfileStore();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "activity",
      reminder_time_time: "09:00",
    },
  });

  const fetchReminders = async () => {
    if (!user || !selectedChildId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("child_id", selectedChildId)
        .order("reminder_time", { ascending: true });
      if (error) throw error;
      setReminders(data as Reminder[] || []);
    } catch (error: any) {
      console.error("Erro ao buscar lembretes:", error);
      toast({ title: "Erro ao buscar lembretes", description: error.message || "Não foi possível carregar.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user && selectedChildId) {
      fetchReminders();
    }
  }, [user, selectedChildId]);

  const handleOpenModal = (reminder: Reminder | null = null) => {
    setEditingReminder(reminder);
    if (reminder) {
      const reminderDate = parseISO(reminder.reminder_time);
      form.reset({
        id: reminder.id,
        title: reminder.title,
        description: reminder.description || "",
        reminder_time_date: reminderDate,
        reminder_time_time: format(reminderDate, "HH:mm"),
        type: reminder.type,
      });
    } else {
      form.reset({
        id: undefined,
        title: "",
        description: "",
        reminder_time_date: new Date(),
        reminder_time_time: "09:00",
        type: "activity",
      });
    }
    setIsModalOpen(true);
  };

  async function onSubmitReminder(values: ReminderFormValues) {
    if (!user || !selectedChildId) {
      toast({ title: "Erro", description: "Usuário ou criança não selecionado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const [hours, minutes] = values.reminder_time_time.split(":").map(Number);
    const combinedDateTime = new Date(values.reminder_time_date);
    combinedDateTime.setHours(hours, minutes, 0, 0); // Set hours and minutes, reset seconds and ms

    try {
      const reminderData = {
        title: values.title,
        description: values.description,
        reminder_time: combinedDateTime.toISOString(),
        type: values.type,
        child_id: selectedChildId,
        user_id: user.id,
      };

      if (editingReminder) {
        const { error } = await supabase
          .from("reminders")
          .update(reminderData)
          .eq("id", editingReminder.id)
          .eq("user_id", user.id);
        if (error) throw error;
        toast({ title: "Sucesso!", description: "Lembrete atualizado." });
      } else {
        const { error } = await supabase.from("reminders").insert([{ ...reminderData, is_completed: false }]);
        if (error) throw error;
        toast({ title: "Sucesso!", description: "Lembrete adicionado." });
      }
      form.reset();
      setIsModalOpen(false);
      setEditingReminder(null);
      fetchReminders();
    } catch (error: any) {
      console.error("Erro ao salvar lembrete:", error);
      toast({ title: "Erro ao salvar", description: error.message || "Não foi possível salvar.", variant: "destructive" });
    }
    setIsSubmitting(false);
  }

  const toggleReminderCompletion = async (reminder: Reminder) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("reminders")
        .update({ is_completed: !reminder.is_completed })
        .eq("id", reminder.id)
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Sucesso!", description: `Lembrete ${!reminder.is_completed ? "concluído" : "pendente"}.` });
      fetchReminders();
    } catch (error: any) {
      console.error("Erro ao atualizar lembrete:", error);
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", reminderId)
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Sucesso!", description: "Lembrete excluído." });
      fetchReminders();
    } catch (error: any) {
      console.error("Erro ao excluir lembrete:", error);
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  const selectedProfile = childrenProfiles.find(p => p.child_id === selectedChildId);

  if (!selectedChildId) {
    return (
      <div className="p-4 md:p-6">
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Lembretes</CardTitle>
            <CardDescription>Selecione um perfil de criança no Dashboard para gerenciar os lembretes.</CardDescription>
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
            <CardDescription>Gerencie consultas, medicações e atividades.</CardDescription>
          </div>
          <Button onClick={() => handleOpenModal()} className="dark:bg-blue-600 dark:hover:bg-blue-700">
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Lembrete
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-center py-4">Carregando...</p>}
          {!isLoading && reminders.length === 0 && (
            <p className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhum lembrete. Adicione o primeiro!</p>
          )}
          {!isLoading && reminders.length > 0 && (
            <div className="space-y-4">
              {reminders.map((reminder) => (
                <Card key={reminder.id} className={`dark:bg-gray-700 shadow-sm ${reminder.is_completed ? "opacity-60 dark:border-green-700 border-green-500" : "dark:border-gray-600"}`}>
                  <CardHeader className="pb-3 flex flex-row items-start justify-between">
                    <div className="flex-grow">
                      <CardTitle className="text-lg flex items-center">
                        <BellRing className={`mr-2 h-5 w-5 ${reminder.is_completed ? "text-green-500" : "text-yellow-400"}`} />
                        {reminder.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-400 dark:text-gray-300 mt-1">
                        {format(parseISO(reminder.reminder_time), "dd/MM/yyyy HH:mm")} - <span className="capitalize font-medium">{reminder.type}</span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Button variant={reminder.is_completed ? "outline" : "default"} size="icon" onClick={() => toggleReminderCompletion(reminder)} className={`h-8 w-8 ${reminder.is_completed ? "dark:hover:bg-gray-600 border-green-500" : "dark:bg-green-600 dark:hover:bg-green-700"}`}>
                        {reminder.is_completed ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleOpenModal(reminder)} className="dark:hover:bg-gray-600 h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="dark:bg-gray-900">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o lembrete "{reminder.title}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="dark:hover:bg-gray-700">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteReminder(reminder.id)} className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  {reminder.description && (
                    <CardContent className="pt-0 pb-3">
                      <p className="text-sm text-gray-300 dark:text-gray-200 whitespace-pre-wrap">{reminder.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>{editingReminder ? "Editar Lembrete" : "Adicionar Lembrete"}</DialogTitle>
            <DialogDescription>
              {editingReminder ? "Modifique os detalhes." : "Preencha os detalhes."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitReminder)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Consulta com Dr. Silva" {...field} className="dark:bg-gray-800 dark:text-white dark:border-gray-700" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Levar exames anteriores" {...field} className="dark:bg-gray-800 dark:text-white dark:border-gray-700" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex space-x-2">
                <FormField
                  control={form.control}
                  name="reminder_time_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col flex-grow">
                      <FormLabel>Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal dark:bg-gray-800 dark:text-white dark:border-gray-700",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP", { locale: require('date-fns/locale/pt-BR') }) : <span>Escolha uma data</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 dark:bg-gray-950" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="dark:bg-gray-900"
                            locale={require('date-fns/locale/pt-BR')}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reminder_time_time"
                  render={({ field }) => (
                    <FormItem className="flex flex-col w-28">
                      <FormLabel>Hora</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className="dark:bg-gray-800 dark:text-white dark:border-gray-700" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="dark:bg-gray-800 dark:text-white dark:border-gray-700">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-900">
                        <SelectItem value="appointment" className="dark:hover:bg-gray-700">Consulta</SelectItem>
                        <SelectItem value="medication" className="dark:hover:bg-gray-700">Medicação</SelectItem>
                        <SelectItem value="activity" className="dark:hover:bg-gray-700">Atividade</SelectItem>
                        <SelectItem value="other" className="dark:hover:bg-gray-700">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="dark:hover:bg-gray-700">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting} className="dark:bg-blue-600 dark:hover:bg-blue-700">
                  {isSubmitting ? "Salvando..." : (editingReminder ? "Salvar Alterações" : "Adicionar Lembrete")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

