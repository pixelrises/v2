import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import PixelrisesAI from "@/pages/PixelrisesAI";

describe("PixelrisesAI compatibility", () => {
  it("keeps the corrected V1 generator available after the V2 isolation", () => {
    window.localStorage.clear();

    render(
      <BrowserRouter>
        <PixelrisesAI />
      </BrowserRouter>,
    );

    expect(screen.getAllByText("Générateur IA").length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/Décrivez le site à créer/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Générer le site/ })).toBeInTheDocument();
  });
});
