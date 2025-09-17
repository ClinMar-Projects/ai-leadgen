"use client";

import { useState } from "react";

/**
 * Lead form component.  Displays a short form for users who want a
 * follow-up from a physical therapist.  On submission, it posts to
 * /api/lead.  The parent page can include this component below the
 * answer card.
 */
export default function LeadForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = { name, email, note };
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setSent(true);
    } catch (err) {
      console.error(err);
    }
  }

  if (sent) {
    return <p className="text-sm">Thanks! We’ll be in touch shortly.</p>;
  }

  return (
    <form onSubmit={submit} className="card stack-small">
      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Complete PDF report</div>
      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
        Enter your details to receive your personalized PDF evaluation.
      </p>
      <input
        className="input"
        placeholder="Your Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="input"
        placeholder="Email Address *"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <textarea
        className="input"
        rows={3}
        placeholder="Anything we should know?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button className="button" type="submit">
        Submit
      </button>
    </form>
  );
}