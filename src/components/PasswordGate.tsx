import { useState } from "react";

const CORRECT_PASSWORD = "WeezeeGPT-11";
const STORAGE_KEY = "wz_unlocked";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "1"
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input === CORRECT_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
      setInput("");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          padding: "40px",
          background: "#111",
          borderRadius: "12px",
          border: "1px solid #222",
          minWidth: "320px",
        }}
      >
        <div style={{ fontSize: "22px", fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>
          WeezeeGPT
        </div>
        <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
          Enter password to continue
        </div>
        <input
          type="password"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          placeholder="Password"
          autoFocus
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "8px",
            border: error ? "1px solid #ef4444" : "1px solid #333",
            background: "#1a1a1a",
            color: "#fff",
            fontSize: "15px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {error && (
          <div style={{ fontSize: "13px", color: "#ef4444", alignSelf: "flex-start" }}>
            Incorrect password
          </div>
        )}
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            background: "#fff",
            color: "#000",
            fontWeight: 600,
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Enter
        </button>
      </form>
    </div>
  );
}
