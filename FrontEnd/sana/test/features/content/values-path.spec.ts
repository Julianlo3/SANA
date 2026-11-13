import { Heart, HeartHandshake, Lock, Sparkles, Users } from "lucide-react";
import { describe, expect, it } from "vitest";
import { pickValueIcon } from "@/features/content/values-path";

describe("pickValueIcon", () => {
  it("reconoce títulos con y sin tildes y en mayúsculas", () => {
    expect(pickValueIcon("EMPATÍA", 0)).toBe(HeartHandshake);
    expect(pickValueIcon("empatia", 3)).toBe(HeartHandshake);
    expect(pickValueIcon("Trabajo en equipo", 0)).toBe(Users);
    expect(pickValueIcon("Confidencialidad", 0)).toBe(Lock);
  });

  it("usa un ícono de respaldo determinista por índice", () => {
    expect(pickValueIcon("Paciencia", 0)).toBe(Sparkles);
    expect(pickValueIcon("Paciencia", 1)).toBe(Heart);
    expect(pickValueIcon("Paciencia", 7)).toBe(Heart);
    expect(pickValueIcon("Paciencia", 1)).toBe(pickValueIcon("Paciencia", 1));
  });
});
