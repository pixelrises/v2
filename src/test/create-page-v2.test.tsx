import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Create from "@/pages/Create";

const renderCreate = () =>
  render(
    <BrowserRouter>
      <Create />
    </BrowserRouter>,
  );

describe("/create V2", () => {
  it("shows site, agent and game entry points", () => {
    renderCreate();

    expect(screen.getAllByText(/Créer un site/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Créer un agent IA/i)).toBeInTheDocument();
    expect(screen.getByText(/Créer un jeu/i)).toBeInTheDocument();
    expect(screen.getByText(/Aucune publication automatique/i)).toBeInTheDocument();
  });
});
