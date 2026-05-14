import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import AISpaceDetail from "@/pages/AISpaceDetail";
import AISpaces from "@/pages/AISpaces";

describe("AI Spaces pages", () => {
  it("shows all AI Space entry cards with specialized outputs", () => {
    render(
      <MemoryRouter>
        <AISpaces />
      </MemoryRouter>,
    );

    expect(screen.getByText("Business AI")).toBeInTheDocument();
    expect(screen.getByText("Student AI")).toBeInTheDocument();
    expect(screen.getByText("Management AI")).toBeInTheDocument();
    expect(screen.getByText("Enterprise AI")).toBeInTheDocument();
    expect(screen.getByText("Creator AI")).toBeInTheDocument();
    expect(screen.getByText("General AI")).toBeInTheDocument();
    expect(screen.getAllByText(/Sortie principale/i).length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText(/Des builders puissants/i)).toBeInTheDocument();
    expect(screen.getByText(/IA Pixelrises sécurisée/i)).toBeInTheDocument();
    expect(screen.queryByText(/Product Lab/i)).not.toBeInTheDocument();
  });

  it("opens Business AI with workspace, quick actions and builder links", async () => {
    render(
      <MemoryRouter initialEntries={["/ai-spaces/business"]}>
        <Routes>
          <Route path="/ai-spaces/:spaceId" element={<AISpaceDetail />} />
          <Route path="/ai-spaces" element={<AISpaces />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Business AI")).toBeInTheDocument();
    expect(screen.getByText("Atelier business-first")).toBeInTheDocument();
    expect(screen.getByText("Structurer mon offre")).toBeInTheDocument();
    expect(screen.getByText("Envoyer à l'IA Pixelrises")).toBeInTheDocument();
    expect(screen.getByText("Créer un site")).toBeInTheDocument();
    expect(screen.getByText("Templates spécialisés")).toBeInTheDocument();
    expect(screen.getByText("Web Agent / Extension")).toBeInTheDocument();
    expect(screen.getByText(/Historique indisponible pour le moment/i)).toBeInTheDocument();
  });

  it("renders Student, Management, Creator and Enterprise with honest connected-tool states", async () => {
    render(
      <MemoryRouter initialEntries={["/ai-spaces/student"]}>
        <Routes>
          <Route path="/ai-spaces/:spaceId" element={<AISpaceDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Studio de révision")).toBeInTheDocument();
    expect(screen.getByText("Fiche de révision structurée")).toBeInTheDocument();
    expect(screen.getByText("Recherche Google préparée")).toBeInTheDocument();
    expect(screen.getByText("Connexion requise")).toBeInTheDocument();

    cleanup();
    render(
      <MemoryRouter initialEntries={["/ai-spaces/management"]}>
        <Routes>
          <Route path="/ai-spaces/:spaceId" element={<AISpaceDetail />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText("Command center opérationnel")).toBeInTheDocument();
    expect(screen.getByText("Import Excel / CSV")).toBeInTheDocument();

    cleanup();
    render(
      <MemoryRouter initialEntries={["/ai-spaces/creator"]}>
        <Routes>
          <Route path="/ai-spaces/:spaceId" element={<AISpaceDetail />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText("Studio d'inspiration et de contenu")).toBeInTheDocument();
    expect(screen.getByText("Inspirations et articles")).toBeInTheDocument();
    expect(screen.getByText("Prompt en 6 blocs")).toBeInTheDocument();

    cleanup();
    render(
      <MemoryRouter initialEntries={["/ai-spaces/enterprise"]}>
        <Routes>
          <Route path="/ai-spaces/:spaceId" element={<AISpaceDetail />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText("Workspace documentaire sécurisé")).toBeInTheDocument();
    expect(screen.getByText("Upload sécurisé de fichiers")).toBeInTheDocument();
    expect(screen.getAllByText(/Aucun fichier local/i).length).toBeGreaterThanOrEqual(1);
  });
});
