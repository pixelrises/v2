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
  it("keeps the Pixelrises idea-to-business vision visible", () => {
    renderSiteBuilder();

    expect(screen.getByText(/Vision Pixelrises/i)).toBeInTheDocument();
    expect(screen.getByText(/Comprendre ton idée/i)).toBeInTheDocument();
    expect(screen.getByText(/Créer une présence premium/i)).toBeInTheDocument();
    expect(screen.getByText(/Préparer la prochaine action/i)).toBeInTheDocument();
  });
});
