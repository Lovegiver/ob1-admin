import { Button } from "@/components/ui/button";

interface ConfirmationDialogProps {
    title: string;
    description: string;
    confirmLabel: string;
    isSubmitting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export function ConfirmationDialog({
    title, description, confirmLabel, isSubmitting, onCancel, onConfirm,
}: ConfirmationDialogProps) {
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-description">
            <section className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-slate-900 p-6 shadow-2xl">
                <h2 id="confirmation-title" className="text-xl font-bold text-slate-100">{title}</h2>
                <p id="confirmation-description" className="mt-3 text-sm text-slate-300">{description}</p>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" disabled={isSubmitting} onClick={onCancel}>Annuler</Button>
                    <Button disabled={isSubmitting} onClick={onConfirm}>{isSubmitting ? "Traitement…" : confirmLabel}</Button>
                </div>
            </section>
        </div>
    );
}
