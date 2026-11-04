// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AmountSelector from "@/features/donations/components/amount-selector";
import { MAX_DONATION_COP } from "@/features/donations/services/wompi-service";

describe("AmountSelector", () => {
  afterEach(() => cleanup());

  it("rejects an oversized pasted amount without parsing the full number", () => {
    const onChange = vi.fn();
    const { rerender } = render(<AmountSelector value={0} onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "Monto de tu donación" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "9".repeat(300) } });

    expect(onChange).toHaveBeenLastCalledWith(MAX_DONATION_COP + 1);
    rerender(
      <AmountSelector value={MAX_DONATION_COP + 1} onChange={onChange} />,
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "Supera el máximo permitido",
    );
    expect(screen.getByRole("textbox").getAttribute("maxLength")).toBe(
      String(MAX_DONATION_COP).length + 1 + "",
    );
  });
});
