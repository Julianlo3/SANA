// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Modal from "@/components/ui/modal";

afterEach(cleanup);

describe("Modal", () => {
  it("closes when its accessible backdrop button is activated", () => {
    const onClose = vi.fn();
    render(
      <Modal title="Confirmar acción" onClose={onClose}>
        Contenido del diálogo
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cerrar ventana" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not close when interacting with the dialog content", () => {
    const onClose = vi.fn();
    render(
      <Modal title="Confirmar acción" onClose={onClose}>
        <button type="button">Acción interna</button>
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Acción interna" }));

    expect(onClose).not.toHaveBeenCalled();
  });
});
