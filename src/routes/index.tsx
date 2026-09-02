import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  if (typeof window !== "undefined") {
    window.location.replace("/index.html");
  }
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0D0F1A", color: "#fff", fontFamily: "system-ui" }}>
      <p>Loading Tradelines Marketplace…</p>
      <noscript>
        <meta httpEquiv="refresh" content="0; url=/index.html" />
        <a href="/index.html" style={{ color: "#F0A500" }}>Enter site</a>
      </noscript>
    </div>
  );
}
