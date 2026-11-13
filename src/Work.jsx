import { Link } from "react-router-dom";

export const work = {
  fintech: {
    title: "FinTech", role: "Platform Architect", bg: "#1a1a1a", color: "#fff",
    intro: "Consumer lending and payment products in Bulgaria.",
    sections: [
      {
        label: "Products",
        links: [
          { title: "Credissimo", desc: "Online consumer loans, since 2006", href: "https://credissimo.bg" },
          { title: "Xtra", desc: "App-based online loans", href: "https://xtra.bg" },
          { title: "Umo", desc: "Online consumer loans", href: "https://umo.bg" },
          { title: "Plati Posle", desc: "Buy now, pay later", href: "https://platiposle.bg" },
        ],
      },
    ],
  },
  creative: {
    title: "Creative", role: "Experiential & Interactive", bg: "#FF8000", color: "#fff",
    intro: "Campaigns and interactive experiences from Saatchi & Saatchi Sofia and Digitas Sofia.",
    sections: [
      {
        label: "Mediapool — “You Are What You Read”",
        links: [
          { title: "Campaign launch", desc: "Mediapool exposes fake news using its own tactics · Mar 2017", href: "https://www.mediapool.bg/analizi-i-komentari/mediapool-zapochna-kampaniya-za-izoblichavane-na-falshivite-novini-chrez-sobstvenite-im-pohvati/" },
          { title: "4× Gold at FARA 2017", desc: "Saatchi & Saatchi Sofia named Agency of the Year · Jun 2017", href: "https://www.mediapool.bg/biznes/triumf-za-kampaniyata-na-mediapool-ti-si-tova-koeto-chetesh-sazdadena-ot-saatchisaatchi-sofiya/" },
        ],
      },
      { label: "Videos", videos: ["eBPHSxVJetA", "gdLs-7Rw7bw", "_zrODCqmMrA"] },
    ],
  },
  edtech: {
    title: "EdTech", role: "Interactive Learning Platform", bg: "#3671C6", color: "#fff",
    intro: "National Finansiada — DSK Bank’s digital financial-literacy competition for parent-and-child teams.",
    sections: [
      { label: "Video", videos: ["HrrhA1GKEdY"] },
      {
        label: "Press",
        links: [
          { title: "National Finansiada 2020", desc: "Dnevnik · Oct 2020", href: "https://www.dnevnik.bg/biznes/finansi/2020/10/14/4125738_nacionalna_finansiada_2020_na_banka_dsk_sustezanie_za/" },
          { title: "BAPRA Bright Awards 2021", desc: "3rd place, CSR campaign · DSK Bank · May 2021", href: "https://dskbank.bg/%D0%BD%D0%BE%D0%B2%D0%B8%D0%BD%D0%B8-%D0%B8-%D0%BF%D1%80%D0%BE%D0%BC%D0%BE%D1%86%D0%B8%D0%B8/%D0%B4%D0%B5%D1%82%D0%B0%D0%B9%D0%BB%D0%B8/2021/05/13/%D0%BD%D0%B0%D1%86%D0%B8%D0%BE%D0%BD%D0%B0%D0%BB%D0%BD%D0%B0-%D1%84%D0%B8%D0%BD%D0%B0%D0%BD%D1%81%D0%B8%D0%B0%D0%B4%D0%B0-%D0%BD%D0%B0-%D0%B1%D0%B0%D0%BD%D0%BA%D0%B0-%D0%B4%D1%81%D0%BA-%D1%81-%D0%BE%D1%89%D0%B5-%D0%B5%D0%B4%D0%BD%D0%B0-%D0%BF%D1%80%D0%B5%D1%81%D1%82%D0%B8%D0%B6%D0%BD%D0%B0-%D0%BD%D0%B0%D0%B3%D1%80%D0%B0%D0%B4%D0%B0" },
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
        @media (max-width: 768px){ .row{flex-direction:column;gap:4px} .meta{text-align:left} }
      `}</style>

      {/* ─── HEADER BAND ─── */}
      <header style={{ background: w.bg, color: w.color, padding: "20px var(--pad) 48px" }}>
        <Link to="/" style={{ fontSize: 14, fontWeight: 600, opacity: 0.6 }}>← Back</Link>
        <div className="fu" style={{ marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <h1 style={{ fontSize: "clamp(56px, 10vw, 130px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95 }}>{w.title}</h1>
          <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.6 }}>{w.role}</span>
        </div>
      </header>

      <main className="fu" style={{ padding: "48px var(--pad) 80px", maxWidth: 1200, margin: "0 auto" }}>
        <p style={{ fontSize: "clamp(18px, 2.2vw, 24px)", fontWeight: 500, lineHeight: 1.4, color: "#444", maxWidth: 760, marginBottom: 56 }}>{w.intro}</p>

        {w.sections.map((s) => (
          <section key={s.label} style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: 3, marginBottom: 16 }}>{s.label}</div>

            {s.links?.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener" className="row">
                <span style={{ fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em" }}>{l.title}</span>
                <span className="meta" style={{ fontSize: 14, color: "#888" }}>
                  {l.desc} <span style={{ color: "#bbb" }}>· {host(l.href)}</span> <span className="arr" style={{ display: "inline-block", color: w.bg === "#1a1a1a" ? "#1a1a1a" : w.bg }}>↗</span>
                </span>
              </a>
            ))}

            {s.videos && (
              <div style={{ display: "grid", gridTemplateColumns: s.videos.length > 1 ? "repeat(auto-fit, minmax(320px, 1fr))" : "1fr", gap: 20 }}>
                {s.videos.map((id) => (
                  <div key={id} style={{ position: "relative", paddingTop: "56.25%", background: "#000", borderRadius: 8, overflow: "hidden" }}>
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${id}`}
                      title={`${w.title} video`}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
