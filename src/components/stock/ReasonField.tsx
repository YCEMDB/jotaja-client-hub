import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** Motivo obrigatório para esta operação. */
  required: boolean;
  /** Rótulo customizado. */
  label?: string;
  /** Placeholder. */
  placeholder?: string;
  /** Descrição extra abaixo do rótulo. */
  hint?: string;
  disabled?: boolean;
}

/**
 * Campo de motivo padrão para operações auditáveis de estoque.
 * Marca visualmente quando é exigido pelo backend (suporte assistido
 * ou ação administrativa nativa).
 */
export function ReasonField({
  value, onChange, required, label, placeholder, hint, disabled,
}: Props) {
  return (
    <div>
      <Label>
        {label ?? "Motivo"}
        {required && <span className="text-brand-magenta ml-1">*</span>}
      </Label>
      <Textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? (required ? "Descreva o motivo (mínimo 5 caracteres)" : "Opcional")}
        disabled={disabled}
      />
      {hint && <p className="text-[11px] text-ink/50 mt-1">{hint}</p>}
      {required && (
        <p className="text-[11px] text-ink/60 mt-1">
          Motivo obrigatório — será registrado no log de auditoria.
        </p>
      )}
    </div>
  );
}
