"use client";

import { useState } from "react";

/**
 * Lead form component.  Displays a short form for users who want a
 * follow-up from a physical therapist.  On submission, it posts to
 * /api/lead.  The parent page can include this component below the
 * answer card.
 */
export type LeadFormProps = {
  responses: string[];
  finalAnswer: string;
  reportTitle: string;
  questions: string[];
};

export default function LeadForm({ responses, finalAnswer, reportTitle, questions }: LeadFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // Include the conversation responses, final answer and report title in the
    // payload sent to the backend.  These will be forwarded to the
    // webhook configured in the API route.
    const body = {
      name,
      email,
      phone,
      note,
      responses,
      finalAnswer,
      reportTitle,
      questions,
    };
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
      <input
        className="input"
        placeholder="Phone Number *"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
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