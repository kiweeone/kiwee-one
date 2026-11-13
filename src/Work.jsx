import { Link } from "react-router-dom";

export const work = {
  fintech: {
    title: "FinTech", role: "Platform Architect", bg: "#1a1a1a", color: "#fff",
    intro: "Since 2021 at Credissimo — first as Product Development Manager, now Chief Product Officer leading a 5-brand product ecosystem and a 40+ person team.",
    stats: [
      { value: "700K+", label: "customers served" },
      { value: "€30M+", label: "annual transaction volume" },
      { value: "5", label: "brands in the portfolio" },
      { value: "50K", label: "native app downloads" },
    ],
    sections: [
      {
        label: "Products",
        products: [
          {
            title: "Credissimo", href: "https://credissimo.bg", tag: "Flagship",
            body: "The flagship consumer lender, online since 2006. Fast loans up to €5,000, applied for online with just an ID card — now backed by a native mobile platform.",
            image: null, // e.g. "/fintech/credissimo.png"
          },
          {
            title: "Xtra", href: "https://xtra.bg", tag: "Built 0→1",
            body: "An app-first lending product: loans from €100 to €5,000 over 3–24 months, applied for entirely in the Xtra app with an ID card.",
            image: null,
          },
          {
            title: "Plati Posle", href: "https://platiposle.bg", tag: "Built 0→1",
            body: "Buy now, pay later — split payments for products and services into instalments, with 0% interest for the first 30 days.",
            image: null,
          },
          {
            title: "Umo", href: "https://umo.bg",
            body: "Online consumer loans up to €5,000, repaid over 3–24 months.",
            image: null,
          },
        ],
      },
    ],
  },
  creative: {
    title: "Creative", role: "Experiential & Interactive", bg: "#FF8000", color: "#fff",
    intro: "Campaigns and interactive experiences from Saatchi & Saatchi Sofia and Digitas Sofia.",
    sections: [
      {
        title: "Mediapool — You Are What You Read",
        meta: "Mediapool.bg · Saatchi & Saatchi Sofia · 2017",
        desc: "An anti-fake-news campaign that beat fake news with its own tricks. Readers generated tabloid headlines about their friends, then a mock yellow-press site revealed how fake stories are made to grab attention. It became the agency’s most viral campaign and turned a small outlet into a widely known name in the fight for reliable news.",
        awards: ["FARA 2017 · Gold — Integrated Campaign", "FARA 2017 · Gold — Media Campaign (social, political, media)", "Saatchi & Saatchi Sofia — Agency of the Year 2017"],
        video: "eBPHSxVJetA",
        links: [
          { title: "Campaign launch", desc: "Mediapool · Mar 2017", href: "https://www.mediapool.bg/analizi-i-komentari/mediapool-zapochna-kampaniya-za-izoblichavane-na-falshivite-novini-chrez-sobstvenite-im-pohvati/" },
          { title: "Triumph at FARA 2017", desc: "Mediapool · Jun 2017", href: "https://www.mediapool.bg/biznes/triumf-za-kampaniyata-na-mediapool-ti-si-tova-koeto-chetesh-sazdadena-ot-saatchisaatchi-sofiya/" },
          { title: "Fake news as a springboard", desc: "Capital · Jun 2017", href: "https://www.capital.bg/biznes/media_i_reklama/2017/06/23/2994068_saatchisaatchi_iskame_da_budem_strategicheski_biznes/" },
        ],
      },
      {
        title: "Nissan LEAF — Conquer the Future",
        meta: "Nissan · Case study",
        desc: "EV fans had extraordinary expectations for the second-generation LEAF — the first had become the world’s top-selling electric car, and the new model’s success depended on the impressions of the very first people to experience it. The car exceeded expectations; our role was to emphasise and scale the new experience it delivered.",
        video: "gdLs-7Rw7bw",
      },
      {
        title: "Digital Signage as a Service",
        meta: "Digitas Sofia",
        desc: "A technical multitool connecting customer experience at the point of sale with online communication.",
        video: "_zrODCqmMrA",
      },
    ],
  },
  edtech: {
    title: "EdTech", role: "Interactive Learning Platform", bg: "#3671C6", color: "#fff",
    intro: "Financial-literacy education, built as a national competition.",
    sections: [
      {
        title: "National Finansiada",
        meta: "DSK Bank · Digitas Sofia with MSL, OmniChannel, Dialog",
        desc: "Financial literacy in Bulgaria had been low for years. As the market leader, DSK Bank set out to change that — and we helped by finding the people who know and making them an example for everyone else. Whole families tested their knowledge on our educational platform, and the best 12 teams faced off live in the final, proving financial literacy can be mastered by adults and teenagers alike. One student took a step toward studying abroad by winning an education scholarship.",
        awards: ["2× Gold PR awards (with MSL)", "BAPRA Bright Awards 2021 · 3rd place — CSR campaign"],
        video: "HrrhA1GKEdY",
        links: [
          { title: "National Finansiada 2020", desc: "Dnevnik · Oct 2020", href: "https://www.dnevnik.bg/biznes/finansi/2020/10/14/4125738_nacionalna_finansiada_2020_na_banka_dsk_sustezanie_za/" },
          { title: "Another prestigious award", desc: "DSK Bank · May 2021", href: "https://dskbank.bg/%D0%BD%D0%BE%D0%B2%D0%B8%D0%BD%D0%B8-%D0%B8-%D0%BF%D1%80%D0%BE%D0%BC%D0%BE%D1%86%D0%B8%D0%B8/%D0%B4%D0%B5%D1%82%D0%B0%D0%B9%D0%BB%D0%B8/2021/05/13/%D0%BD%D0%B0%D1%86%D0%B8%D0%BE%D0%BD%D0%B0%D0%BB%D0%BD%D0%B0-%D1%84%D0%B8%D0%BD%D0%B0%D0%BD%D1%81%D0%B8%D0%B0%D0%B4%D0%B0-%D0%BD%D0%B0-%D0%B1%D0%B0%D0%BD%D0%BA%D0%B0-%D0%B4%D1%81%D0%BA-%D1%81-%D0%BE%D1%89%D0%B5-%D0%B5%D0%B4%D0%BD%D0%B0-%D0%BF%D1%80%D0%B5%D1%81%D1%82%D0%B8%D0%B6%D0%BD%D0%B0-%D0%BD%D0%B0%D0%B3%D1%80%D0%B0%D0%B4%D0%B0" },
        ],
      },
    ],
  },
};

const font = "'Inter', -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif";
const host = (u) => new URL(u).hostname.replace(/^www\./, "");

export default function Work({ slug }) {
  const w = work[slug];

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: font, color: "#1a1a1a" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::selection{background:#1a1a1a;color:#fafafa}
        a{text-decoration:none;color:inherit}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .5s ease-out both}
        :root { --pad: 48px; }
        @media (max-width: 768px) { :root { --pad: 32px; } }
        .row{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:24px 0;border-top:1px solid #e0e0e0;transition:padding .3s cubic-bezier(.16,1,.3,1)}
        .row:hover{padding-left:12px}
        .row:hover .arr{transform:translateX(4px)}
        .arr{transition:transform .3s}
        .meta{text-align:right}
        .product{display:grid;grid-template-columns:1fr;gap:32px;align-items:center;padding:40px 0;border-top:1px solid #e0e0e0}
        .product:has(img){grid-template-columns:minmax(0,1fr) minmax(0,1.1fr)}
        .product:hover .arr{transform:translate(3px,-3px)}
        @media (max-width: 900px){ .product:has(img){grid-template-columns:1fr} .stats{grid-template-columns:repeat(2,1fr)!important;row-gap:32px!important} }
        @media (max-width: 768px){ .row{flex-direction:column;gap:4px} .meta{text-align:left} }
      `}</style>

      {/* ─── HEADER BAND ─── */}
      <header style={{ background: w.bg, color: w.color, padding: "20px var(--pad) 48px" }}>
        <Link to="/" style={{ fontSize: 15, fontWeight: 600, opacity: 0.7 }}>← Back</Link>
        <div className="fu" style={{ marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <h1 style={{ fontSize: "clamp(56px, 10vw, 130px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95 }}>{w.title}</h1>
          <span style={{ fontSize: 16, fontWeight: 500, opacity: 0.75 }}>{w.role}</span>
        </div>
      </header>

      <main className="fu" style={{ padding: "56px var(--pad) 96px" }}>
        <p style={{ fontSize: "clamp(20px, 2.4vw, 28px)", fontWeight: 500, lineHeight: 1.4, color: "#1a1a1a", maxWidth: 820, marginBottom: 72 }}>{w.intro}</p>

        {w.stats && (
          <div className="stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginBottom: 80, borderTop: "3px solid #1a1a1a", paddingTop: 28 }}>
            {w.stats.map((st) => (
              <div key={st.label}>
                <div style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>{st.value}</div>
                <div style={{ fontSize: 15, color: "#888", marginTop: 8 }}>{st.label}</div>
              </div>
            ))}
          </div>
        )}

        {w.sections.map((s) => (
          <section key={s.title || s.label} style={{ marginBottom: 88 }}>
            {s.label && (
              <div style={{ fontSize: 12, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: 3, marginBottom: 16 }}>{s.label}</div>
            )}
            {s.title && (
              <div style={{ borderTop: `3px solid ${w.bg}`, paddingTop: 20, marginBottom: 28 }}>
                <h2 style={{ fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05 }}>{s.title}</h2>
                {s.meta && <div style={{ fontSize: 15, fontWeight: 600, color: "#888", marginTop: 12 }}>{s.meta}</div>}
                {s.desc && <p style={{ fontSize: 18, lineHeight: 1.65, color: "#333", maxWidth: 760, marginTop: 24 }}>{s.desc}</p>}
                {s.awards && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
                    {s.awards.map((a) => (
                      <span key={a} style={{ fontSize: 14, fontWeight: 600, padding: "8px 16px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 999, color: "#333" }}>🏆 {a}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {s.video && (
              <div style={{ maxWidth: 960, marginBottom: 24 }}><div style={{ position: "relative", paddingTop: "56.25%", background: "#000", borderRadius: 8, overflow: "hidden" }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${s.video}`}
                  title={s.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                />
              </div></div>
            )}

            {s.products?.map((pr) => (
              <a key={pr.href} href={pr.href} target="_blank" rel="noopener" className="product">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05 }}>{pr.title}</span>
                    {pr.tag && <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, padding: "5px 10px", borderRadius: 6, background: "#1a1a1a", color: "#fff" }}>{pr.tag}</span>}
                  </div>
                  <p style={{ fontSize: 18, lineHeight: 1.65, color: "#444", marginTop: 14, maxWidth: 560 }}>{pr.body}</p>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 16 }}>{host(pr.href)} <span className="arr" style={{ display: "inline-block" }}>↗</span></div>
                </div>
                {pr.image && (
                  <img src={pr.image} alt={`${pr.title} screenshot`} loading="lazy"
                    style={{ width: "100%", borderRadius: 12, border: "1px solid #e5e5e5", boxShadow: "0 12px 40px rgba(0,0,0,.08)", display: "block" }} />
                )}
              </a>
            ))}

            {s.links?.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener" className="row">
                <span style={{ fontSize: s.title ? "clamp(20px, 2.2vw, 24px)" : "clamp(30px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.02em" }}>{l.title}</span>
                <span className="meta" style={{ fontSize: 15, color: "#888" }}>
                  {l.desc} <span style={{ color: "#bbb" }}>· {host(l.href)}</span> <span className="arr" style={{ display: "inline-block", color: w.bg === "#1a1a1a" ? "#1a1a1a" : w.bg }}>↗</span>
                </span>
              </a>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
