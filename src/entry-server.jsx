import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import Landing from "./Landing.jsx";
import About from "./About.jsx";
import Work from "./Work.jsx";

const routes = {
  "/": () => <Landing />,
  "/about": () => <About />,
  "/fintech": () => <Work slug="fintech" />,
  "/creative": () => <Work slug="creative" />,
  "/edtech": () => <Work slug="edtech" />,
};

export const paths = Object.keys(routes);

export function render(path) {
  return renderToString(<StaticRouter location={path}>{routes[path]()}</StaticRouter>);
}

export { pages, person, SITE } from "./seo.js";
