// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ConfirmedField from "@/features/consultation-requests/components/confirmed-field";
import DependentPersonFields from "@/features/consultation-requests/components/dependent-person-fields";

describe("public appointment confirmation fields", () => {
  afterEach(() => cleanup());

  it("allows paste in the original email field but prevents it in its confirmation", () => {
    render(
      <ConfirmedField
        label="Correo"
        confirmLabel="Confirma tu correo"
        value=""
        confirmValue=""
        onChange={vi.fn()}
        onConfirmChange={vi.fn()}
        onBlur={vi.fn()}
        onConfirmBlur={vi.fn()}
      />,
    );

    const [email, confirmEmail] = screen.getAllByRole("textbox");

    expect(fireEvent.paste(email)).toBe(true);
    expect(fireEvent.paste(confirmEmail)).toBe(false);
    expect(
      screen.getByText(
        "Por seguridad, escríbelo manualmente; no se permite pegar.",
      ),
    ).toBeTruthy();
  });

  it("prevents paste in the dependent's identity document confirmation", () => {
    render(
      <DependentPersonFields
        fullName=""
        birthdate=""
        gender=""
        identityDocument=""
        confirmIdentityDocument=""
        errors={{}}
        onFullNameChange={vi.fn()}
        onBirthdateChange={vi.fn()}
        onGenderChange={vi.fn()}
        onIdentityDocumentChange={vi.fn()}
        onConfirmIdentityDocumentChange={vi.fn()}
      />,
    );

    expect(
      fireEvent.paste(
        screen.getByPlaceholderText("Escríbelo de nuevo"),
      ),
    ).toBe(false);
  });
});
