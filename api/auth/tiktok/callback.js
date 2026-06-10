const LOCAL_CALLBACK_URL = "http://localhost:8787/callback/tiktok";

const renderFallbackPage = ({ targetUrl, error }) => `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Connexion TikTok Pixelrises</title>
    <style>
      :root {
        color-scheme: dark;
        background: #050505;
        color: #ffffff;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at 50% 0%, rgba(245, 197, 66, 0.18), transparent 32rem),
          #050505;
      }

      main {
        width: min(92vw, 560px);
        border: 1px solid rgba(245, 197, 66, 0.28);
        border-radius: 28px;
        padding: 32px;
        background: rgba(17, 17, 17, 0.86);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
      }

      .badge {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        color: #f5c542;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h1 {
        margin: 16px 0 10px;
        font-size: clamp(30px, 8vw, 44px);
        line-height: 0.95;
      }

      p {
        color: #9ca3af;
        line-height: 1.6;
      }

      a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-top: 18px;
        padding: 14px 18px;
        border-radius: 999px;
        background: #f5c542;
        color: #050505;
        font-weight: 900;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main>
      <span class="badge">Pixelrises x TikTok</span>
      <h1>${error ? "Connexion à reprendre" : "Connexion reçue"}</h1>
      <p>${error ? "TikTok a renvoyé une erreur. Retourne sur la page de connexion Pixelrises Auto Poster et réessaie." : "On renvoie maintenant l'autorisation vers ton serveur local Pixelrises Auto Poster pour terminer la connexion."}</p>
      <a href="${targetUrl}">${error ? "Retourner à l'autoposter" : "Continuer la connexion"}</a>
    </main>
    <script>
      window.location.replace(${JSON.stringify(targetUrl)});
    </script>
  </body>
</html>`;

export default function handler(req, res) {
  const incoming = new URL(req.url, "https://pixelrises.fr");
  const target = new URL(LOCAL_CALLBACK_URL);

  for (const key of ["code", "state", "error", "error_description"]) {
    const value = incoming.searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }

  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(
    renderFallbackPage({
      targetUrl: target.toString(),
      error: incoming.searchParams.has("error") || incoming.searchParams.has("error_description"),
    }),
  );
}
