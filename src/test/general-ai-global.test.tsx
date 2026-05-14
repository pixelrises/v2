import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { V2PageShell } from "@/components/v2/V2PageShell";

describe("Global General AI assistant", () => {
  it("opens from the V2 shell and routes a user request without executing an action", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <V2PageShell title="Dashboard" description="Test shell">
          <div>Dashboard content</div>
        </V2PageShell>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /ouvrir le conseiller pixelrises/i }));

    expect(screen.getByText("Assistant Pixelrises")).toBeInTheDocument();
    expect(screen.getByText("Aucune action automatique")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/je veux créer un site/i), {
      target: { value: "Je veux créer un site pour mon restaurant" },
    });
    fireEvent.click(screen.getByRole("button", { name: /orienter/i }));

    expect(screen.getByText("Ouvrir Site Builder")).toBeInTheDocument();
    expect(screen.getByText(/La publication reste toujours validée/i)).toBeInTheDocument();
  });
});
