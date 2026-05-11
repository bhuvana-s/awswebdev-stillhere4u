import { useState, useEffect } from "react";
import { getWaitlistCount, joinWaitlist } from "./api.js";

const FONT_LINK = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap";

const ink = "#0F172A";       // primary text (slate-900)
const muted = "#64748B";     // secondary text (slate-500)
const teal = "#0F766E";      // accent (teal-700)
const amber = "#B45309";     // warm accent (amber-700)
const surface = "#FFFFFF";   // card surface
const border = "rgba(15,23,42,0.10)";
const subtle = "rgba(15,23,42,0.04)";

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

  const personal = ["Parent", "Child abroad", "Caregiver"];
  const biz = ["Insurance", "Employer", "Just curious"];

  return (
    <div style={{
      fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
      background: `radial-gradient(1200px 600px at 50% -10%, #ECFDF5 0%, #FAFAFA 55%, #FFFFFF 100%)`,
      color: ink,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      padding: "1.5rem 1.5rem 2rem",
      boxSizing: "border-box",
    }}>
      <style>{`
        @keyframes fu { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .role-btn {
          padding: 9px 18px;
          border-radius: 100px;
          border: 1.5px solid ${border};
          background: ${surface};
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          color: ${muted};
          cursor: pointer;
          transition: all 0.18s ease;
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
          color: #fff;
          font-weight: 600;
        }
        .submit-btn {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.01em;
          transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .submit-btn:enabled {
          background: ${teal};
          color: #fff;
          cursor: pointer;
          box-shadow: 0 6px 22px rgba(15,118,110,0.28);
        }
        .submit-btn:enabled:hover {
          background: #134E4A;
          transform: translateY(-1px);
          box-shadow: 0 8px 26px rgba(19,78,74,0.35);
        }
        .submit-btn:disabled {
          background: ${subtle};
          color: ${muted};
          cursor: default;
        }
        .email-input {
          width: 100%;
          padding: 14px 18px;
          border: 1.5px solid ${border};
          border-radius: 12px;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          background: ${surface};
          color: ${ink};
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .email-input::placeholder { color: ${muted}; }
        .email-input:focus {
          border-color: ${teal};
          box-shadow: 0 0 0 4px rgba(15,118,110,0.10);
        }
      `}</style>

      {/* Logo */}
      <div style={{
        fontFamily: "'DM Serif Display',serif",
        fontSize: "1.25rem",
        color: ink,
        fontWeight: 400,
        letterSpacing: "-0.02em",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}>
        StillHere <span style={{ fontSize: "1rem" }}>💌</span>
      </div>

      {/* Hero — natural size, sits near the top */}
      <main style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "6rem 0 1.5rem",
      }}>
        <h1 style={{
          fontFamily: "'DM Serif Display',serif",
          fontSize: "clamp(2.25rem, 6vw, 4rem)",
          fontWeight: 400,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: ink,
          maxWidth: 760,
          margin: 0,
          opacity: 0,
          animation: "fu 0.7s 0.15s forwards",
        }}>
          Your voice,{" "}
          <em style={{
            fontStyle: "italic",
            color: teal,
            fontWeight: 400,
          }}>always</em>{" "}
          on time.
        </h1>

        <p style={{
          fontSize: "clamp(1rem, 1.8vw, 1.15rem)",
          fontWeight: 400,
          color: muted,
          maxWidth: 720,
          lineHeight: 1.6,
          marginTop: "2rem",
          marginBottom: 0,
          textWrap: "balance",
          opacity: 0,
          animation: "fu 0.7s 0.35s forwards",
        }}>
          Time-locked letters, voice stories, and video messages —<br />
          delivered to the people you love at exactly the right moment in life.
        </p>
      </main>

      {/* CTA pinned near bottom */}
      <section style={{
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        opacity: 0,
        animation: "fu 0.7s 0.55s forwards",
      }}>
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "1.4rem",
              fontWeight: 400,
              color: ink,
              textAlign: "center",
              margin: "1.5rem 0 1.5rem",
              letterSpacing: "-0.01em",
            }}>
              Join the waitlist
            </h2>
            <input
              type="email"
              className="email-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ marginBottom: 16 }}
            />

            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: muted, textAlign: "left", margin: "4px 0 8px" }}>
              I'm here as…
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
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
            <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 0 }}>
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

            <button
              type="submit"
              className="submit-btn"
              disabled={!email || !role || loading}
              style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}
            >
              {loading ? "Submitting…" : "Submit"}
            </button>

            {error && (
              <p style={{ fontSize: 12, color: amber, marginTop: 10, marginBottom: 0 }}>{error}</p>
            )}
            {count > 0 && !error && (
              <p style={{ fontSize: 12, color: muted, marginTop: 10, marginBottom: 0, textAlign: "center" }}>
                <span style={{ color: teal, fontWeight: 700 }}>{count}</span> already signed up
              </p>
            )}
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(15,118,110,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, margin: "0 auto 0.75rem",
            }}>💌</div>
            <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.75rem", color: ink, margin: "0 0 0.4rem" }}>
              You're in.
            </h2>
            <p style={{ color: muted, fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
              We'll reach out when StillHere is ready for you.
            </p>
            {count > 0 && (
              <p style={{ fontSize: 12, color: muted, marginTop: "0.75rem", marginBottom: 0 }}>
                <span style={{ color: teal, fontWeight: 700 }}>{count}</span> families and counting
              </p>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: "2rem",
        fontSize: 12,
        fontStyle: "italic",
        color: muted,
        textAlign: "center",
      }}>
        We'll only email you about StillHere. No spam, no sharing, ever.
      </footer>
    </div>
  );
}
