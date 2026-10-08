import InlineMessage from "@/components/feedback/inline-message";

type Props = {
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly loadingText: string;
};

/** Mensaje de carga o de error de una lista. No muestra nada si ya terminó bien. */
export default function LoadState({ isLoading, error, loadingText }: Props) {
  if (error) {
    return (
      <div className="mt-6">
        <InlineMessage tone="error">{error}</InlineMessage>
      </div>
    );
  }

  if (isLoading) {
    return <p className="mt-8 text-sm text-text-subtle">{loadingText}</p>;
  }

  return null;
}