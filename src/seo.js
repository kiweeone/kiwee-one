// Page titles/descriptions — used by the build-time prerender and by the client on navigation.
export const SITE = "https://www.kiwee.one";
export const NAME = "Zhelyo Ivanov";

export const pages = {
  "/": {
    title: "Zhelyo Ivanov — Chief Product Officer | kiwee.one",
    description: "Zhelyo Ivanov — Chief Product Officer at Credissimo. Product leader across FinTech, EdTech and award-winning creative work; builder of Samardala and F1 Predictor.",
  },
  "/about": {
    title: "About Zhelyo Ivanov — Product Leader & CPO | kiwee.one",
    description: "Zhelyo Ivanov's career: Chief Product Officer at Credissimo, formerly Saatchi & Saatchi and Digitas Sofia. Experience, competencies and CV.",
  },
  "/fintech": {
    title: "FinTech — Zhelyo Ivanov | kiwee.one",
    description: "Consumer lending and payment products built by Zhelyo Ivanov: Credissimo, Xtra, Umo and Plati Posle.",
  },
  "/creative": {
    title: "Creative — Zhelyo Ivanov | kiwee.one",
    description: "Campaigns and interactive work by Zhelyo Ivanov at Saatchi & Saatchi Sofia and Digitas Sofia — Mediapool “You Are What You Read”, Nissan LEAF, Digital Signage as a Service.",
  },
  "/edtech": {
    title: "EdTech — National Finansiada | Zhelyo Ivanov",
    description: "National Finansiada — DSK Bank's award-winning financial-literacy competition for families, built by Zhelyo Ivanov's team at Digitas Sofia.",
  },
  "/f1predictor": {
    title: "F1 Predictor — AI-Powered F1 Fantasy Tool | kiwee.one",
    description: "F1 Predictor by Zhelyo Ivanov — an AI-powered Formula 1 fantasy prediction tool.",
  },
};

export const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": SITE + "/#person",
  name: NAME,
  alternateName: "Жельо Иванов",
  url: SITE + "/",
  jobTitle: "Chief Product Officer",
  description: "Product leader across FinTech, EdTech and award-winning creative technology. Chief Product Officer at Credissimo; formerly Saatchi & Saatchi Sofia and Digitas Sofia.",
  knowsAbout: ["Product management", "FinTech", "Consumer lending", "Buy now, pay later", "EdTech", "Experiential technology", "WebGL"],
  worksFor: { "@type": "Organization", name: "Credissimo", url: "https://credissimo.bg" },
  alumniOf: [
    { "@type": "Organization", name: "Saatchi & Saatchi Sofia" },
    { "@type": "Organization", name: "Digitas Sofia" },
  ],
  sameAs: [
    "https://www.linkedin.com/in/zhelyoivanov/",
    "https://github.com/kiweeone",
    "https://samardala.com/",
  ],
};
