/** Gaya input form yang sama dengan panel pengaturan data. */
export const fieldClass = "h-10 w-full min-w-0 rounded-md border bg-card px-3 text-sm font-normal transition-colors duration-150 hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive";

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return <span id={id} role="alert" className="block text-xs font-normal text-destructive">{message}</span>;
}
