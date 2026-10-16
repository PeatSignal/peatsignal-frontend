"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useActor } from "@/components/providers/actor-context";
import { useRepositoryMutation } from "@/components/providers/data-hooks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { errorMessage } from "@/lib/api";
import { priorityLabels } from "@/lib/domain/labels";
import { findArea } from "@/lib/domain/areas";
import type { Hotspot, PriorityAssessment, PriorityLevel } from "@/types";
import { fieldClass, FieldError } from "./form-fields";

const formSchema = z.object({
  title: z.string().trim().min(5, "Judul minimal 5 karakter").max(120, "Judul maksimal 120 karakter"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW", "INSUFFICIENT_DATA"]),
  assignee_id: z.string(),
  note: z.string().trim().max(500, "Catatan maksimal 500 karakter"),
});
type FormValues = z.infer<typeof formSchema>;

export type TaskSource = { kind: "assessment"; assessment: PriorityAssessment } | { kind: "hotspot"; hotspot: Hotspot };

function describeSource(source: TaskSource) {
  if (source.kind === "assessment") {
    const { assessment } = source;
    return { label: assessment.target.label, mode: assessment.mode, priority: assessment.priority, assessment_id: assessment.id, hotspot_id: null, area_id: assessment.area_id };
  }
  const { hotspot } = source;
  const area = findArea(hotspot.area_id);
  return {
    label: `titik ${hotspot.latitude.toFixed(4)}, ${hotspot.longitude.toFixed(4)}${area ? ` (${area.region})` : ""}`,
    mode: hotspot.mode, priority: "MEDIUM" as PriorityLevel, assessment_id: null, hotspot_id: hotspot.id, area_id: hotspot.area_id,
  };
}

/** Form pembuatan tugas pemeriksaan dari assessment prioritas atau satu titik panas. */
export function CreateTaskDialog({ source, open, onOpenChange }: {
  source: TaskSource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const origin = describeSource(source);
  const router = useRouter();
  const id = useId();
  const { actor, users } = useActor();
  const officers = users.filter((user) => user.role === "field_officer");
  const createTask = useRepositoryMutation((repo, values: FormValues) => {
    if (!actor) throw new Error("Pengguna demo belum dimuat.");
    return repo.createTask({
      mode: origin.mode,
      title: values.title,
      priority: values.priority,
      assessment_id: origin.assessment_id,
      hotspot_id: origin.hotspot_id,
      area_id: origin.area_id,
      assignee_id: values.assignee_id || null,
      note: values.note || null,
    }, { actor });
  });

  const { register, control, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: `Periksa anomali panas — ${origin.label}`.slice(0, 120),
      priority: origin.priority,
      assignee_id: officers[0]?.id ?? "",
      note: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const task = await createTask.mutate(values);
      toast.success("Tugas dibuat", {
        description: task.assignee_id ? "Petugas sudah ditugaskan." : "Tugas menunggu petugas.",
        action: { label: "Buka tugas", onClick: () => router.push(`/tasks?tugas=${encodeURIComponent(task.id)}`) },
      });
      reset();
      onOpenChange(false);
    } catch {
      // Pesan ditampilkan di form dari status mutasi.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel="Tutup form tugas" className="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="border-b px-5 pt-5 pb-4 sm:px-6">
            <div className="pr-9">
              <DialogTitle>Buat tugas pemeriksaan</DialogTitle>
              <DialogDescription className="mt-1">{source.kind === "hotspot" ? "Dari titik panas" : "Dari prioritas"} {origin.label} · tugas lapangan berlabel SIMULASI.</DialogDescription>
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            <label className="block space-y-1.5 text-sm font-medium" htmlFor={`${id}-title`}>
              <span>Judul tugas</span>
              <input id={`${id}-title`} className={fieldClass} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? `${id}-title-error` : undefined} {...register("title")} />
              <FieldError id={`${id}-title-error`} message={errors.title?.message} />
            </label>
            <div className="grid gap-4 min-[420px]:grid-cols-2">
              <label className="block space-y-1.5 text-sm font-medium" htmlFor={`${id}-priority`}>
                <span>Prioritas</span>
                <Controller control={control} name="priority" render={({ field }) =>
                  <Select id={`${id}-priority`} aria-label="Prioritas" value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} ref={field.ref}
                    options={(Object.keys(priorityLabels) as PriorityLevel[]).map((value) => ({ value, label: priorityLabels[value] }))} />
                } />
              </label>
              <label className="block space-y-1.5 text-sm font-medium" htmlFor={`${id}-assignee`}>
                <span>Petugas</span>
                <Controller control={control} name="assignee_id" render={({ field }) =>
                  <Select id={`${id}-assignee`} aria-label="Petugas" value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} ref={field.ref}
                    options={[{ value: "", label: "Tentukan nanti" }, ...officers.map((user) => ({ value: user.id, label: user.display_name }))]} />
                } />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm font-medium" htmlFor={`${id}-note`}>
              <span>Catatan untuk petugas <span className="font-normal text-muted-foreground">(opsional)</span></span>
              <textarea id={`${id}-note`} rows={3} className={`${fieldClass} h-auto py-2`} aria-invalid={Boolean(errors.note)} {...register("note")} />
              <FieldError message={errors.note?.message} />
            </label>
            {createTask.status === "error" && (
              <Alert className="border-red-200 bg-red-50" role="alert"><AlertDescription className="mt-0 text-red-900">{errorMessage(createTask.error)}</AlertDescription></Alert>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t bg-muted/40 px-5 py-3.5 sm:px-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={createTask.isPending}>{createTask.isPending ? "Menyimpan…" : "Buat tugas"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
