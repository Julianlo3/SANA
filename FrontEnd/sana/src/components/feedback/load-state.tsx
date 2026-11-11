import InlineMessage from "@/components/feedback/inline-message";

/**
 * Defines the props type.
 */
type Props = {
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly loadingText: string;
};

/**
 * Renders a list loading or error message, and nothing after successful loading.
 * @param props Component properties.
 */
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