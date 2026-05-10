import { useState, useEffect } from "react";
import { getWaitlistCount, joinWaitlist } from "./api.js";

const FONT_LINK = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap";

export default function StillHereLanding() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!document.querySelector(`link[href="${FONT_LINK}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = FONT_LINK;
      document.head.appendChild(link);
    }
    (async () => {
      try {
        const { count: n } = await getWaitlistCount();
        setCount(n || 0);
      } catch (err) {
        console.warn("count fetch failed:", err);
      }
    })();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !role || loading) return;
    setLoading(true);
    setError("");
    try {
      const source = new URLSearchParams(window.location.search).get("src") || "landing-page";
      const { count: n } = await joinWaitlist({ email, role, source });
      if (typeof n === "number") setCount(n);
      setSubmitted(true);
    } catch (err) {
      setError(err.message === "invalid email" ? "Please enter a valid email." : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const teal = "#4ECDC4";
  const amber = "#E8A849";
  const navy = "#1B2838";
  const gray = "#8A9BB0";

  const personal = ["Parent", "Child abroad", "Caregiver"];
  const biz = ["Insurance", "Employer", "Just curious"];

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: `linear-gradient(170deg, #141E2B 0%, ${navy} 40%, #1F3044 100%)`,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      padding: "2rem 1.5rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Nav logo */}
      <div style={{
        position:"absolute", top:"1.25rem", left:"1.5rem",
        fontFamily:"'DM Serif Display',serif", fontSize:"1.3rem",
        color: teal, fontWeight:700, letterSpacing:"-0.02em",
        display:"flex", alignItems:"center", gap:"8px",
      }}>
        StillHere <span style={{fontSize:"1.1rem"}}>💌</span>
      </div>

      {/* Background glow */}
      <div style={{ position:"absolute", top:"-100px", right:"-200px", width:"600px", height:"600px", background:`radial-gradient(circle,rgba(78,205,196,0.06) 0%,transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"-150px", left:"-100px", width:"500px", height:"500px", background:`radial-gradient(circle,rgba(232,168,73,0.05) 0%,transparent 70%)`, pointerEvents:"none" }} />

      <style>{`
        @keyframes fu { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .role-btn {
          padding: 9px 18px;
          border-radius: 100px;
          border: 1.5px solid rgba(255,255,255,0.12);
          background: transparent;
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          color: ${gray};
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          user-select: none;
        }
        .role-btn:hover {
          border-color: ${teal};
          color: ${teal};
        }
        .role-btn.selected {
          background: ${teal};
          border-color: ${teal};
          color: ${navy};
          font-weight: 700;
          transform: scale(1.03);
        }
        .role-btn.biz {
          border-style: dashed;
        }
        .role-btn.biz.selected {
          background: ${amber};
          border-color: ${amber};
          border-style: solid;
          color: ${navy};
          font-weight: 700;
          transform: scale(1.03);
        }
      `}</style>

      {/* Badge */}
      <div style={{
        fontSize:"11px", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase",
        color: teal, background:"rgba(78,205,196,0.1)", border:"1px solid rgba(78,205,196,0.15)",
        padding:"6px 18px", borderRadius:"100px", marginBottom:"2rem",
        opacity:0, animation:"fu 0.7s 0.2s forwards",
      }}>
        Early access · 2026
      </div>

      {/* Headline */}
      <h1 style={{
        fontFamily:"'DM Serif Display',serif", fontSize:"clamp(2rem,5.5vw,3.5rem)", fontWeight:400,
        lineHeight:1.18, color:"#fff", maxWidth:"650px", marginBottom:"0.5rem", letterSpacing:"-0.02em",
        opacity:0, animation:"fu 0.7s 0.35s forwards",
      }}>
        That 3am question<br/>never goes away.
      </h1>

      {/* Question */}
      <p style={{
        fontFamily:"'DM Serif Display',serif", fontSize:"clamp(1.3rem,3.5vw,2rem)",
        color: amber, marginBottom:"1rem",
        opacity:0, animation:"fu 0.7s 0.5s forwards",
      }}>
        "What if I'm not there?"
      </p>

      {/* Divider */}
      <div style={{
        width:"60px", height:"2px", background: teal, margin:"0 auto 1rem",
        opacity:0, animation:"fu 0.7s 0.6s forwards",
      }} />

      {/* Answer */}
      <p style={{
        fontSize:"clamp(1.1rem,2.5vw,1.4rem)", fontWeight:600, color:"#fff", marginBottom:"0.4rem",
        opacity:0, animation:"fu 0.7s 0.7s forwards",
      }}>
        <span style={{ color: teal, fontWeight: 700 }}>StillHere</span> is the answer.
      </p>

      {/* Tagline */}
      <p style={{
        fontSize:"1rem", fontWeight:300, color: gray, maxWidth:"480px", lineHeight:1.6, marginBottom:"0.5rem",
        opacity:0, animation:"fu 0.7s 0.78s forwards",
      }}>
        Your love, always on time. Your voice, forever present.
      </p>

      {/* Description */}
      <p style={{
        fontSize:"0.85rem", fontWeight:300, color:"rgba(255,255,255,0.4)", maxWidth:"500px",
        lineHeight:1.6, marginBottom:"2.5rem",
        opacity:0, animation:"fu 0.7s 0.85s forwards",
      }}>
        Time-locked letters, voice stories, and video messages — delivered to the people you love at exactly the right moment in life.
      </p>

      {/* ─── FORM OR THANK YOU ─── */}
      <div style={{ opacity:0, animation:"fu 0.7s 0.9s forwards", width:"100%", maxWidth:"460px" }}>
        {!submitted ? (
          <div>
            {/* Email input */}
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width:"100%", padding:"14px 18px", border:"1.5px solid rgba(255,255,255,0.12)",
                borderRadius:"12px", fontSize:"15px", fontFamily:"'DM Sans',sans-serif",
                background:"rgba(255,255,255,0.06)", color:"#fff", outline:"none",
                marginBottom:"14px", boxSizing:"border-box",
              }}
              onFocus={(e) => e.target.style.borderColor = teal}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
            />

            {/* Row label */}
            <p style={{ fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color: gray, textAlign:"left", marginBottom:"8px" }}>
              I'm here as...
            </p>

            {/* Personal roles */}
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"12px" }}>
              {personal.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`role-btn ${role === r ? "selected" : ""}`}
                  onClick={() => setRole(r)}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Biz label */}
            <p style={{ fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color: gray, textAlign:"left", marginBottom:"8px" }}>
              I represent...
            </p>

            {/* Biz roles */}
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"18px" }}>
              {biz.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`role-btn biz ${role === r ? "selected" : ""}`}
                  onClick={() => setRole(r)}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!email || !role || loading}
              style={{
                width:"100%", padding:"14px", border:"none", borderRadius:"12px",
                background: (!email || !role) ? "rgba(255,255,255,0.08)" : teal,
                color: (!email || !role) ? gray : navy,
                fontSize:"15px", fontWeight:700, fontFamily:"'DM Sans',sans-serif",
                cursor: (!email || !role) ? "default" : "pointer",
                transition:"all 0.25s", letterSpacing:"0.01em",
              }}
              onMouseEnter={(e) => { if (email && role) e.target.style.background = "#F5C97A"; }}
              onMouseLeave={(e) => { if (email && role) e.target.style.background = teal; }}
            >
              {loading ? "Joining..." : "Join the waitlist — it's free"}
            </button>

            {/* Error */}
            {error && (
              <p style={{ fontSize:"12px", color: amber, marginTop:"10px" }}>
                {error}
              </p>
            )}

            {/* Social proof */}
            {count > 0 && !error && (
              <p style={{ fontSize:"12px", color: gray, marginTop:"10px" }}>
                <span style={{ color: teal, fontWeight:700 }}>{count}</span> already signed up
              </p>
            )}
          </div>
        ) : (
          <div style={{ textAlign:"center" }}>
            <div style={{
              width:"56px", height:"56px", borderRadius:"50%", background:"rgba(78,205,196,0.1)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:"26px",
              margin:"0 auto 0.75rem",
            }}>💌</div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.75rem", color:"#fff", marginBottom:"0.4rem" }}>
              You're in.
            </h2>
            <p style={{ color: gray, fontSize:"0.95rem", lineHeight:1.6 }}>
              We'll reach out when StillHere is ready for you.
            </p>
            {count > 0 && (
              <p style={{ fontSize:"12px", color: gray, marginTop:"0.75rem" }}>
                <span style={{ color: teal, fontWeight:700 }}>{count}</span> families and counting
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer line */}
      <p style={{
        position:"absolute", bottom:"1.25rem",
        fontSize:"12px", color:"rgba(255,255,255,0.25)",
      }}>
        <span style={{ color: teal, fontWeight:600 }}>stillhere.io</span>
        {" · "}hello@stillhere.io{" · "}Built on AWS{" · "}© 2026 Intuitive.ai
      </p>
    </div>
  );
}
