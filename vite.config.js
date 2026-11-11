// Multi-page site: every page is a real HTML file (good for SEO and fast
// first paint). Shared chrome (nav, footer, mobile bar, favicon) lives in
// /partials and is stitched in with <!--@include name--> at dev and build time.
import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const partialsDir = resolve(root, "partials");

function partials() {
  return {
    name: "partials",
    transformIndexHtml: {
      order: "pre",
      handler: (html) =>
        html.replace(/<!--@include ([\w-]+)-->/g, (_, name) =>
          readFileSync(resolve(partialsDir, `${name}.html`), "utf8")
        ),
    },
    configureServer(server) {
      server.watcher.add(partialsDir);
      server.watcher.on("change", (file) => {
        if (file.startsWith(partialsDir)) server.ws.send({ type: "full-reload" });
      });
    },
  };
}

export default defineConfig({
  appType: "mpa",
  plugins: [partials()],
  build: {
    rollupOptions: {
      input: {
        home: resolve(root, "index.html"),
        projects: resolve(root, "projects/index.html"),
        project: resolve(root, "projects/project.html"),
        process: resolve(root, "process/index.html"),
        contact: resolve(root, "contact/index.html"),
      },
    },
  },
});
