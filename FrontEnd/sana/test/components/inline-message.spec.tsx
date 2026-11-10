// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import InlineMessage from "@/components/feedback/inline-message";

describe("InlineMessage", () => {
  afterEach(() => cleanup());

  it("renders informational messages with a status role by default", () => {
    render(<InlineMessage>Informational message</InlineMessage>);

    expect(screen.getByRole("status").textContent).toBe(
      "Informational message",
    );
  });

  it("renders success messages with a status role", () => {
    render(<InlineMessage tone="success">Saved</InlineMessage>);

    expect(screen.getByRole("status").textContent).toBe("Saved");
  });

  it("renders error messages with an alert role", () => {
    render(<InlineMessage tone="error">Request failed</InlineMessage>);

    expect(screen.getByRole("alert").textContent).toBe("Request failed");
  });

  it("renders a dismiss button and calls its handler", () => {
    const onDismiss = vi.fn();
    render(
      <InlineMessage onDismiss={onDismiss}>Dismissible message</InlineMessage>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cerrar mensaje" }));

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("does not render a dismiss button when no handler is provided", () => {
    render(<InlineMessage>Persistent message</InlineMessage>);

    expect(
      screen.queryByRole("button", { name: "Cerrar mensaje" }),
    ).toBeNull();
  });
});
