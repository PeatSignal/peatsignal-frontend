"use client";

import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, Play, RotateCcw, Send, UserCheck, XCircle } from "lucide-react";
import { useActor } from "@/components/providers/actor-context";
import { useRepositoryMutation } from "@/components/providers/data-hooks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { errorMessage } from "@/lib/api";
import { reportResultLabels, roleLabels, taskStatusLabels } from "@/lib/domain/labels";
import { canSubmitReport, canTransition, isTerminal } from "@/lib/domain/task-state-machine";
import { formatDateTime } from "@/lib/format";
import type { FieldReportResult, InspectionTask, TaskStatus, User } from "@/types";
import { fieldClass, FieldError } from "./form-fields";

function MutationError({ error }: { error: unknown }) {
  return <Alert role="alert" className="border-red-200 bg-red-50"><AlertDescription className="mt-0 text-red-900">{errorMessage(error)}</AlertDescription></Alert>;
}

function Panel({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <section aria-label="Tindakan" className="space-y-3 rounded-xl border border-primary/15 bg-secondary/30 p-4 sm:p-5">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** Koordinator: tugaskan petugas (OPEN / NEEDS_FOLLOWUP → ASSIGNED). */
function AssignForm({ task, actor, followUp }: { task: InspectionTask; actor: User; followUp: boolean }) {
  const id = useId();
  const { users } = useActor();
  const officers = users.filter((user) => user.role === "field_officer");
  const [assignee, setAssignee] = useState(task.assignee_id ?? officers[0]?.id ?? "");
  const [note, setNote] = useState("");
  const assign = useRepositoryMutation((repo) => repo.updateTask(task.id, { status: "ASSIGNED", assignee_id: assignee, note: note.trim() || null }, { actor }));

  return (
    <Panel title={followUp ? "Tugaskan untuk tindak lanjut" : "Tugaskan petugas"} description={followUp ? "Pilih petugas untuk pemeriksaan ulang." : undefined}>
      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!assignee) return;
          try {
            await assign.mutate();
            toast.success("Petugas ditugaskan", { description: officers.find((user) => user.id === assignee)?.display_name });
            setNote("");
          } catch { /* ditampilkan di bawah */ }
        }}
      >
        <label className="block space-y-1.5 text-sm font-medium" htmlFor={`${id}-assignee`}>
          <span>Petugas</span>
          <Select id={`${id}-assignee`} aria-label="Petugas" value={assignee} onValueChange={setAssignee} required
            options={officers.map((user) => ({ value: user.id, label: user.display_name }))} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium" htmlFor={`${id}-note`}>
          <span>Catatan <span className="font-normal text-muted-foreground">(opsional)</span></span>
          <textarea id={`${id}-note`} rows={2} maxLength={500} className={`${fieldClass} h-auto py-2`} value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        {assign.status === "error" && <MutationError error={assign.error} />}
        <Button type="submit" disabled={assign.isPending || !assignee}><UserCheck aria-hidden="true" />{assign.isPending ? "Menyimpan…" : "Tugaskan"}</Button>
      </form>
    </Panel>
  );
}

/** Koordinator: tinjau laporan (SUBMITTED → VERIFIED / NEEDS_FOLLOWUP / DISMISSED). */
function ReviewForm({ task, actor }: { task: InspectionTask; actor: User }) {
  const id = useId();
  const [note, setNote] = useState("");
  const review = useRepositoryMutation((repo, status: TaskStatus) => repo.updateTask(task.id, { status, note: note.trim() || null }, { actor }));
  const decide = async (status: TaskStatus) => {
    try {
      await review.mutate(status);
      toast.success(`Status: ${taskStatusLabels[status]}`);
      setNote("");
    } catch { /* ditampilkan di bawah */ }
  };
  return (
    <Panel title="Tinjau laporan">
      <label className="block space-y-1.5 text-sm font-medium" htmlFor={`${id}-note`}>
        <span>Catatan tinjauan <span className="font-normal text-muted-foreground">(opsional)</span></span>
        <textarea id={`${id}-note`} rows={2} maxLength={500} className={`${fieldClass} h-auto py-2`} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      {review.status === "error" && <MutationError error={review.error} />}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => decide("VERIFIED")} disabled={review.isPending}><CheckCircle2 aria-hidden="true" />Verifikasi</Button>
        <Button variant="outline" onClick={() => decide("NEEDS_FOLLOWUP")} disabled={review.isPending}><RotateCcw aria-hidden="true" />Minta tindak lanjut</Button>
        <Button variant="outline" onClick={() => decide("DISMISSED")} disabled={review.isPending}><XCircle aria-hidden="true" />Tutup tanpa temuan</Button>
      </div>
    </Panel>
  );
}

/** Petugas yang ditugaskan: mulai pekerjaan (ASSIGNED → IN_PROGRESS). */
function StartWork({ task, actor }: { task: InspectionTask; actor: User }) {
  const start = useRepositoryMutation((repo) => repo.updateTask(task.id, { status: "IN_PROGRESS" }, { actor }));
  return (
    <Panel title="Mulai pemeriksaan" description="Mulai untuk mengisi laporan.">
      {start.status === "error" && <MutationError error={start.error} />}
      <Button
        onClick={async () => {
          try {
            await start.mutate();
            toast.success("Tugas sedang dikerjakan");
          } catch { /* ditampilkan di atas */ }
        }}
        disabled={start.isPending}
      >
        <Play aria-hidden="true" />{start.isPending ? "Menyimpan…" : "Mulai kerjakan"}
      </Button>
    </Panel>
  );
}

const RESULTS: readonly FieldReportResult[] = ["ACTIVE_FIRE_FOUND", "BURN_SCAR_FOUND", "NO_FIRE_FOUND", "LOCATION_INACCESSIBLE"];

/** Waktu lokal untuk form laporan, presisi detik. */
function localDateTimeValue(ms: number): string {
  const date = new Date(ms);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function reportSchema(createdAt: string) {
  return z.object({
    result: z.enum(["ACTIVE_FIRE_FOUND", "BURN_SCAR_FOUND", "NO_FIRE_FOUND", "LOCATION_INACCESSIBLE"], { message: "Pilih hasil pemeriksaan" }),
    observed_at: z.string().min(1, "Isi waktu pengamatan").refine((value) => !Number.isNaN(Date.parse(value)), "Waktu tidak valid")
      .refine((value) => Date.parse(value) <= Date.now() + 60_000, "Waktu pengamatan tidak boleh di masa depan")
      .refine((value) => Date.parse(value) >= Date.parse(createdAt) - 1000, `Waktu tidak boleh sebelum tugas dibuat (${formatDateTime(createdAt)})`),
    note: z.string().trim().min(3, "Catatan minimal 3 karakter").max(1000, "Catatan maksimal 1000 karakter"),
    evidence_url: z.union([z.literal(""), z.url("URL bukti tidak valid")]),
  });
}
type ReportValues = z.infer<ReturnType<typeof reportSchema>>;

/** Petugas yang ditugaskan: kirim laporan SIMULASI (IN_PROGRESS → SUBMITTED). */
function ReportForm({ task, actor }: { task: InspectionTask; actor: User }) {
  const id = useId();
  const [openedAt] = useState(() => Date.now());
  const submit = useRepositoryMutation((repo, values: ReportValues) => repo.createReport(task.id, {
    result: values.result,
    observed_at: new Date(values.observed_at).toISOString(),
    note: values.note,
    evidence_url: values.evidence_url || null,
    is_simulation: true,
  }, { actor }));
  const { register, control, handleSubmit, formState: { errors } } = useForm<ReportValues>({
    resolver: zodResolver(reportSchema(task.created_at)),
    defaultValues: { observed_at: localDateTimeValue(openedAt), note: "", evidence_url: "" },
  });

  return (
    <Panel title="Kirim laporan lapangan" description="SIMULASI · menunggu tinjauan setelah dikirim.">
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          try {
            await submit.mutate(values);
            toast.success("Laporan terkirim", { description: "Menunggu tinjauan koordinator." });
          } catch { /* ditampilkan di bawah */ }
        })}
      >
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Hasil pemeriksaan</legend>
          <div className="grid gap-2 min-[480px]:grid-cols-2">
            {RESULTS.map((result) => (
              <label key={result} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border bg-card px-3 py-2 text-sm transition-colors duration-150 hover:border-primary/25 has-[:checked]:border-primary has-[:checked]:bg-secondary">
                <input type="radio" value={result} className="size-4 accent-[var(--color-primary)]" {...register("result")} />
                {reportResultLabels[result]}
              </label>
            ))}
          </div>
          <FieldError message={errors.result?.message} />
        </fieldset>
        <fieldset className="space-y-2 text-sm font-medium">
          <legend>Waktu pengamatan</legend>
          <Controller name="observed_at" control={control} render={({ field }) =>
            <DateTimePicker value={field.value} onChange={field.onChange} invalid={Boolean(errors.observed_at)} errorId={`${id}-time-error`} />
          } />
          <FieldError id={`${id}-time-error`} message={errors.observed_at?.message} />
        </fieldset>
        <label className="block space-y-1.5 text-sm font-medium" htmlFor={`${id}-note`}>
          <span>Apa yang Anda lihat?</span>
          <textarea id={`${id}-note`} rows={3} className={`${fieldClass} h-auto py-2`} aria-invalid={Boolean(errors.note)} placeholder="Contoh: tidak ada asap atau bekas terbakar di sekitar titik." {...register("note")} />
          <FieldError message={errors.note?.message} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium" htmlFor={`${id}-evidence`}>
          <span>Tautan foto/bukti <span className="font-normal text-muted-foreground">(opsional)</span></span>
          <input id={`${id}-evidence`} type="url" inputMode="url" placeholder="https://…" className={fieldClass} aria-invalid={Boolean(errors.evidence_url)} {...register("evidence_url")} />
          <FieldError message={errors.evidence_url?.message} />
        </label>
        {submit.status === "error" && <MutationError error={submit.error} />}
        <Button type="submit" disabled={submit.isPending}><Send aria-hidden="true" />{submit.isPending ? "Mengirim…" : "Kirim laporan SIMULASI"}</Button>
      </form>
    </Panel>
  );
}

/** Tindakan yang tersedia untuk peran demo saat ini; aturan sama dengan state machine server. */
export function TaskActions({ task }: { task: InspectionTask }) {
  const { actor, users } = useActor();
  if (!actor) return null;
  const assigneeName = users.find((user) => user.id === task.assignee_id)?.display_name ?? "petugas";

  if (canTransition(task, "ASSIGNED", actor, { nextAssigneeId: task.assignee_id ?? "pending" }).ok) {
    return <AssignForm key={task.id} task={task} actor={actor} followUp={task.status === "NEEDS_FOLLOWUP"} />;
  }
  if (task.status === "SUBMITTED" && canTransition(task, "VERIFIED", actor).ok) return <ReviewForm key={task.id} task={task} actor={actor} />;
  if (canTransition(task, "IN_PROGRESS", actor).ok) return <StartWork task={task} actor={actor} />;
  if (canSubmitReport(task, actor).ok) return <ReportForm key={task.id} task={task} actor={actor} />;

  if (isTerminal(task.status)) {
    return <Panel title="Tugas selesai" description={task.status === "VERIFIED" ? "Laporan sudah diverifikasi koordinator." : "Tugas ditutup tanpa temuan."} />;
  }
  const waiting: Partial<Record<TaskStatus, string>> = {
    OPEN: "Menunggu koordinator menugaskan petugas.",
    ASSIGNED: `Menunggu ${assigneeName} memulai pemeriksaan.`,
    IN_PROGRESS: `${assigneeName} sedang memeriksa lokasi.`,
    SUBMITTED: "Laporan terkirim. Menunggu tinjauan koordinator.",
    NEEDS_FOLLOWUP: "Menunggu koordinator menugaskan pemeriksaan ulang.",
  };
  return (
    <Panel
      title="Belum ada tindakan untuk Anda"
      description={`${waiting[task.status] ?? ""} Anda masuk sebagai ${roleLabels[actor.role].toLowerCase()} (${actor.display_name}). Untuk peran lain, keluar lalu masuk dengan akun lain.`}
    />
  );
}
