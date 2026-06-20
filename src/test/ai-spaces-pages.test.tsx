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
    expect(screen.getByText(/IA Pixelrises s(é|Ã©|ÃƒÂ©)curis(é|Ã©|ÃƒÂ©)e/i)).toBeInTheDocument();
    expect(screen.queryByText(/Product Lab/i)).not.toBeInTheDocument();
  });

  it("opens Business AI as a chat and preview workshop without generic model copy", async () => {
    render(
      <MemoryRouter initialEntries={["/ai-spaces/business"]}>
        <Routes>
          <Route path="/ai-spaces/:spaceId" element={<AISpaceDetail />} />
          <Route path="/ai-spaces" element={<AISpaces />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Business AI Pixelrises")).toBeInTheDocument();
    expect(screen.getByText(/Cr(é|Ã©|ÃƒÂ©)e, teste et structure ton business/i)).toBeInTheDocument();
    expect(screen.getByText(/Que veux-tu construire aujourd'hui/i)).toBeInTheDocument();
    expect(screen.getAllByText("Simple").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Avanc(é|Ã©|ÃƒÂ©)/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Mode Direct").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Mode Plan").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("/app")).toBeInTheDocument();
    expect(screen.getByText("/site")).toBeInTheDocument();
    expect(screen.getByText("/landing")).toBeInTheDocument();
    expect(screen.getByText("/prototype")).toBeInTheDocument();
    expect(screen.getByText("/image")).toBeInTheDocument();
    expect(screen.getByText("/brand")).toBeInTheDocument();
    expect(screen.getByText("AI Orchestrator / experts")).toBeInTheDocument();
    expect(screen.getAllByText("Preview").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Structure").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Code").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Brief").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Assets").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Tests").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Historique & brouillons/i)).toBeInTheDocument();
    expect(screen.queryByText(/zap/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Clone UI/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Import Figma/i)).not.toBeInTheDocument();
  });

  it("opens Student AI as a pedagogical chat and preview workshop", async () => {
    render(
      <MemoryRouter initialEntries={["/ai-spaces/student"]}>
        <Routes>
          <Route path="/ai-spaces/:spaceId" element={<AISpaceDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Student AI Pixelrises")).toBeInTheDocument();
    expect(screen.getByText(/Comment puis-je t'aider/)).toBeInTheDocument();
    expect(screen.getByText(/Que veux-tu apprendre ou pr(é|Ã©|ÃƒÂ©)parer/i)).toBeInTheDocument();
    expect(screen.getAllByText("Simple").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Avanc(é|Ã©|ÃƒÂ©)/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Mode Direct").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Mode Plan").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("/fiche")).toBeInTheDocument();
    expect(screen.getByText("/quiz")).toBeInTheDocument();
    expect(screen.getByText("/flashcards")).toBeInTheDocument();
    expect(screen.getByText("/slides")).toBeInTheDocument();
    expect(screen.getByText("/oral")).toBeInTheDocument();
    expect(screen.getByText("/resume")).toBeInTheDocument();
    expect(screen.getByText("/planning")).toBeInTheDocument();
    expect(screen.getByText("/interro")).toBeInTheDocument();
    expect(screen.getByText("/corriger")).toBeInTheDocument();
    expect(screen.getByText("/expliquer")).toBeInTheDocument();
    expect(screen.getByText("/methode")).toBeInTheDocument();
    expect(screen.getByText("/sources")).toBeInTheDocument();
    expect(screen.getByText("/recherche")).toBeInTheDocument();
    expect(screen.queryByText("/site")).not.toBeInTheDocument();
    expect(screen.queryByText("/app")).not.toBeInTheDocument();
    expect(screen.queryByText("/jeu")).not.toBeInTheDocument();
    expect(screen.getByText("/agent")).toBeInTheDocument();
    expect(screen.getByText(/Aper(ç|Ã§|ÃƒÂ§)u/)).toBeInTheDocument();
    expect(screen.getAllByText("Structure").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Questions").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Correction").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/M(é|Ã©|ÃƒÂ©)thode/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Export")).toBeInTheDocument();
    expect(screen.getByText(/Historique & travaux/i)).toBeInTheDocument();
    expect(screen.getByText(/Anti-triche p(é|Ã©|ÃƒÂ©)dagogique/i)).toBeInTheDocument();
    expect(screen.getByText(/Sites, apps, jeux/i)).toBeInTheDocument();
    expect(screen.getByText(/Agents IA guid(é|Ã©|ÃƒÂ©)s/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Fiche de r(é|Ã©|ÃƒÂ©)vision structur(é|Ã©|ÃƒÂ©)e/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Recherche Google pr(é|Ã©|ÃƒÂ©)par(é|Ã©|ÃƒÂ©)e/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Connexion requise")).toBeInTheDocument();
    expect(screen.queryByText(/Clone UI/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Import Figma/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/provider/i)).not.toBeInTheDocument();
  });

  it("renders Management, Creator and Enterprise with honest connected-tool states", async () => {
    render(
      <MemoryRouter initialEntries={["/ai-spaces/management"]}>
        <Routes>
          <Route path="/ai-spaces/:spaceId" element={<AISpaceDetail />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Command center op(é|Ã©|ÃƒÂ©)rationnel/)).toBeInTheDocument();
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
    expect(await screen.findByText(/Workspace documentaire s(é|Ã©|ÃƒÂ©)curis(é|Ã©|ÃƒÂ©)/)).toBeInTheDocument();
    expect(screen.getByText(/Upload s(é|Ã©|ÃƒÂ©)curis(é|Ã©|ÃƒÂ©) de fichiers/)).toBeInTheDocument();
    expect(screen.getAllByText(/Aucun fichier local/i).length).toBeGreaterThanOrEqual(1);
  });
});
