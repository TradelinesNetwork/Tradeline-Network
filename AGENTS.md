<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep shared static-page presentation in the final financial theme stylesheet; it is loaded last to consistently override legacy styles without altering purchasing scripts.
- Keep the root content route as the static homepage bridge with its own metadata; public HTML pages remain the existing user experience.
- Scope homepage-only decoration to its body class in the final theme stylesheet so purchasing and account layouts are unaffected.
- Keep static-header cart navigation in the shared site asset helper, including asynchronously injected checkout headers, so cart access stays consistent without modifying purchasing logic.
- Keep shared loading and keyboard navigation in the site asset helper, with visual states in the final theme stylesheet, so public and injected headers behave consistently.
- Keep dashboard chart rendering in a browser-safe presentation module using only already-loaded orders; never invent credit scores or add a separate account fetch for visual summaries.
- Keep the Three.js visual source in src/visuals and its browser-only bundle in public/assets/js; regenerate it with `bun build src/visuals/financial-scene.js --target browser --format iife --minify --outfile public/assets/js/financial-scene.js` after source edits. Initialize through the shared helper only on the static homepage, retaining the existing illustration as the no-WebGL fallback.
