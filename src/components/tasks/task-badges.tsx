import { Badge } from "@/components/ui/badge";
import { priorityLabels, taskStatusLabels } from "@/lib/domain/labels";
import type { PriorityLevel, TaskStatus } from "@/types";

const priorityVariant: Record<PriorityLevel, "destructive" | "warning" | "teal" | "outline"> = {
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "teal",
  INSUFFICIENT_DATA: "outline",
};

export function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  return <Badge variant={priorityVariant[priority]}>Prioritas {priorityLabels[priority].toLowerCase()}</Badge>;
}

const statusVariant: Record<TaskStatus, "default" | "warning" | "teal" | "outline" | "destructive"> = {
  OPEN: "outline",
  ASSIGNED: "teal",
  IN_PROGRESS: "teal",
  SUBMITTED: "warning",
  NEEDS_FOLLOWUP: "destructive",
  VERIFIED: "default",
  DISMISSED: "outline",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={statusVariant[status]}>{taskStatusLabels[status]}</Badge>;
}
