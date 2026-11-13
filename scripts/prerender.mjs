// Runs after `vite build`: renders each content page to static HTML so search
// engines see the text without executing JavaScript. The client app still boots
// and takes over as before.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { render, paths } = await import(pathToFileURL(resolve("dist-server/entry-server.js")).href);
const { pages, person, SITE } = await import(pathToFileURL(resolve("dist-server/entry-server.js")).href);

const template = readFileSync("dist/index.html", "utf8");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function head(path) {
  const { title, description } = pages[path];
  const url = SITE + (path === "/" ? "/" : path);
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${path === "/" ? "profile" : "website"}" />`,
    `<meta property="og:site_name" content="kiwee.one" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:card" content="summary" />`,
    path === "/" ? `<script type="application/ld+json">${JSON.stringify(person)}</script>` : "",
  ].join("\n    ");
}

for (const path of paths) {
  const html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/, "")
    .replace(/<meta name="description"[^>]*>\s*/, "")
    .replace("</head>", `  ${head(path)}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${render(path)}</div>`);
  const out = path === "/" ? "dist/index.html" : `dist${path}/index.html`;
  mkdirSync(out.replace(/\/index\.html$/, ""), { recursive: true });
  writeFileSync(out, html);
  console.log("prerendered", path);
}

// SPA fallback for routes we don't prerender (e.g. /f1predictor): keep a clean shell.
writeFileSync("dist/app.html", template);
rmSync("dist-server", { recursive: true, force: true });
