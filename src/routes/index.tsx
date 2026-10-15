import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tradelines Network | Authorized User Tradelines" },
      { name: "description", content: "Browse authorized user tradelines by bank, credit limit and account age with Tradelines Network." },
      { property: "og:title", content: "Tradelines Network | Authorized User Tradelines" },
      { property: "og:description", content: "Explore the Tradelines Network marketplace and manage your authorized user tradeline orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  if (typeof window !== "undefined") {
    window.location.replace("/index.html");
  }
  return (
    <div className="grid min-h-screen place-items-center bg-background text-foreground">
      <p>Loading Tradelines Marketplace…</p>
      <noscript>
        <meta httpEquiv="refresh" content="0; url=/index.html" />
        <a href="/index.html" className="text-primary">Enter site</a>
      </noscript>
    </div>
  );
}
