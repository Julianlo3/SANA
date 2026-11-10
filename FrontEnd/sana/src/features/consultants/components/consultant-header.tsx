import { User } from "lucide-react";

/**
 * Defines the props type.
 */
type Props = {
  fullName: string;
  identityDocument: string;
};

/**
 * Shared consultant header with avatar, name, and identity document.
 * @param props Component properties.
 */
export default function ConsultantHeader({ fullName, identityDocument }: Props) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <User size={24} aria-hidden />
      </span>
      <div>
        <h1 className="font-display text-2xl font-bold text-text">
          {fullName}
        </h1>
        <p className="text-sm text-text-subtle">
          Documento {identityDocument}
        </p>
      </div>
    </div>
  );
}