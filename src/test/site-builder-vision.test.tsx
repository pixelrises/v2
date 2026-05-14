import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import SiteBuilder from "@/pages/SiteBuilder";

const renderSiteBuilder = () =>
  render(
    <BrowserRouter>
      <SiteBuilder />
    </BrowserRouter>,
  );

describe("Site Builder V2 vision", () => {
  it("keeps the Pixelrises idea-to-business vision and honest quality analysis visible", () => {
    renderSiteBuilder();

    expect(screen.getByText(/Brief IA/i)).toBeInTheDocument();
    expect(screen.getByText(/Créer la preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Améliorations suggérées/i)).toBeInTheDocument();
    expect(screen.getByText(/Édition visuelle prête/i)).toBeInTheDocument();
    expect(screen.getByText(/Analytique/i)).toBeInTheDocument();
    expect(screen.getByText(/SEO & recherche IA/i)).toBeInTheDocument();
    expect(screen.queryByText(/AI Orchestrator/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Gateway/i)).not.toBeInTheDocument();
  });
});
