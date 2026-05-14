import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataBadge, EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { dataStateMeta, type DataState } from "@/lib/data-state";

const states: DataState[] = ["real", "example", "mock", "pending", "error", "empty"];

describe("DataState UI contract", () => {
  it("keeps all public data states explicit and bounded", () => {
    expect(states).toHaveLength(6);

    for (const state of states) {
      expect(dataStateMeta[state].label).toBeTruthy();
      expect(dataStateMeta[state].description).toBeTruthy();
    }
  });

  it("renders badges that make example and mock data visible", () => {
    render(
      <div>
        <DataBadge state="example" />
        <DataBadge state="mock" />
        <DataBadge state="real" />
      </div>,
    );

    expect(screen.getByText("Exemple")).toBeInTheDocument();
    expect(screen.getByText("Données locales")).toBeInTheDocument();
    expect(screen.getByText("Données réelles")).toBeInTheDocument();
  });

  it("provides premium loading, empty and error states", () => {
    render(
      <div>
        <LoadingState title="Chargement" description="Données en cours." />
        <EmptyState title="Vide" description="Aucune donnée." />
        <ErrorState title="Erreur" description="Action impossible." />
      </div>,
    );

    expect(screen.getByText("Chargement")).toBeInTheDocument();
    expect(screen.getByText("Vide")).toBeInTheDocument();
    expect(screen.getByText("Erreur")).toBeInTheDocument();
  });
});
