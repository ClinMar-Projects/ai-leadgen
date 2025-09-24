"use client";

import { useState } from "react";

/**
 * Lead form component.  Displays a short form for users who want a
 * follow-up from a physical therapist.  On submission, it posts to
 * /api/lead.  The parent page can include this component below the
 * answer card.
 */
export type LeadFormProps = {
  /**
   * The array of user responses collected during the conversation.
   */
  responses: string[];
  /**
   * The assistant's final answer without the FINAL: prefix.  This
   * includes the suggestions and recommendations for the injury.
   */
  finalAnswer: string;
  /**
   * A short report title derived from the final answer, e.g.
   * "Shoulder Pain Evaluation Report".  Used for labelling the
   * evaluation card and to infer the pain type on the booking page.
   */
  reportTitle: string;
  /**
   * The list of questions the assistant asked.  Useful for
   * providing context in downstream workflows.
   */
  questions: string[];
  /**
   * Optional callback invoked after the form submits successfully.
   * Receives the full payload sent to the webhook so the parent
   * component can perform post-submit actions such as navigating
   * to a booking page.  If omitted, the form will simply show a
   * thank-you message when submission succeeds.
   */
  onComplete?: (data: {
    name: string;
    email: string;
    phone: string;
    note: string;
    responses: string[];
    finalAnswer: string;
    reportTitle: string;
    questions: string[];
  }) => void;
};

export default function LeadForm({ responses, finalAnswer, reportTitle, questions, onComplete }: LeadFormProps) {
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
      // Mark submission as sent
      setSent(true);
      // Invoke optional callback so the parent page can navigate
      if (onComplete) {
        try {
          onComplete(body);
        } catch (err) {
          // swallow callback errors to avoid blocking UI
          console.error(err);
        }
      }
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
        required
      />
      <input
        className="input"
        placeholder="Email Address *"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="input"
        placeholder="Phone Number *"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
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