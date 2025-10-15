"use client";

import { useEffect, useState } from "react";
import LeadForm from "../../components/LeadForm";

// Reuse the Message type from the main page.  If this file is moved
// or the type changes, update accordingly.
type Message = {
  role: "system" | "assistant" | "user";
  content: string;
};

/**
 * A lightweight chat widget component.  This page is intended to be
 * embedded within an iframe and provides a compact chat interface
 * without the hero section or microphone setup.  It uses the same
 * conversation logic as the main page: the assistant asks targeted
 * questions one at a time and provides a final answer when enough
 * information has been gathered.  A simple reset button allows the
 * user to restart the conversation.
 */
export default function WidgetChatPage() {
  // Conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [finalAnswer, setFinalAnswer] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState<number | null>(null);
  const [bookingInfo, setBookingInfo] = useState<null | {
    name: string;
    email: string;
    phone: string;
    note: string;
    responses: string[];
    finalAnswer: string;
    reportTitle: string;
    questions: string[];
  }>(null);

  // System prompt and initial question reused from the main page.  If
  // these change in the main page, they should be updated here too.
  const CONVO_PROMPT =
    "You are a helpful orthopedic injury assistant. Ask the user a series of specific, clear, concise questions (e.g. location of pain, when it started, severity, activities that make it better or worse) to understand their injury, one at a time. Do not apologise or ask generic questions like 'Can you provide more information'; instead ask targeted questions to gather the details you need. Only ask one question at a time. When you have enough information to provide insight on what is likely going on and suggest next steps, you MUST prefix your final answer with the word 'FINAL:' (capital letters, followed by a colon and a space). This prefix is required so the system knows the conversation is over. After providing your 'FINAL:' answer, do not ask any more questions.";
  const INITIAL_QUESTION = "Tell me about the pain you are experiencing.";

  // Processing steps reused for consistency; these briefly show what
  // Olivia does after receiving sufficient information.  The widget
  // displays these steps between the user's last answer and the final
  // report.  If you wish to simplify the widget further, you can
  // remove this phase and directly show the final answer.
  const processingSteps = [
    {
      title: "Applying clinical assessment logic",
      description: "Validated screening methods and diagnostic protocols.",
    },
    {
      title: "Focusing on real‑world answers",
      description: "Practical guidance for everyday health concerns and conditions.",
    },
    {
      title: "Pulling from top‑tier sources",
      description: "Cochrane, NIH, medical journals, and clinical databases.",
    },
    {
      title: "Translating into plain English",
      description: "Medical clarity without the medical speak.",
    },
    {
      title: "Screening for red flags",
      description: "Urgent or serious conditions get flagged immediately.",
    },
    {
      title: "Comparing symptom patterns",
      description: "Olivia runs hundreds of diagnostic combinations in seconds.",
    },
  ];

  // Determine a short report title based on keywords in the final answer.
  function determineReportTitle(answer: string): string {
    const lower = answer.toLowerCase();
    if (lower.includes("shoulder")) return "Shoulder Pain Evaluation Report";
    if (lower.includes("knee")) return "Knee Pain Evaluation Report";
    if (lower.includes("back")) return "Back Pain Evaluation Report";
    if (lower.includes("hip")) return "Hip Pain Evaluation Report";
    return "Pain Evaluation Report";
  }

  // Classify the final answer into a status chip with colours.
  function classifyAnswer(answer: string): { label: string; bg: string; text: string } {
    const lower = answer.toLowerCase();
    if (/(urgent|doctor|seek|emergency|immediate|red flag|medical evaluation|hospital)/.test(lower)) {
      return { label: "Medical evaluation recommended", bg: "#fecaca", text: "#b91c1c" };
    }
    if (/(speak with|speak to|consult|pt|physical therapist|therapist)/.test(lower)) {
      return { label: "Speak with a PT", bg: "#fef9c3", text: "#92400e" };
    }
    return { label: "Self care appropriate", bg: "#d1fae5", text: "#065f46" };
  }

  // Kick off the conversation when the widget loads.
  useEffect(() => {
    if (messages.length === 0) {
      const initialMsgs: Message[] = [
        { role: "system", content: CONVO_PROMPT },
        { role: "assistant", content: INITIAL_QUESTION },
      ];
      setMessages(initialMsgs);
      setCurrentQuestion(INITIAL_QUESTION);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper function to call the backend with the current conversation.
  async function askAssistant(msgs: Message[]) {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || "Failed to fetch response");
      }
      const fullMsg = (await res.text()).trim();
      setMessages((prev) => [...prev, { role: "assistant", content: fullMsg }]);
      const withoutPrefix = fullMsg.replace(/^FINAL:\s*/, "").trim();
      const looksLikeQuestion = /\?/.test(fullMsg);
      const sentences = fullMsg.split(/\.\s+/);
      const looksLikeFinal =
        fullMsg.startsWith("FINAL:") ||
        (!looksLikeQuestion && (fullMsg.length > 120 || sentences.length > 1));
      if (looksLikeFinal) {
        setFinalAnswer(withoutPrefix);
        setCurrentQuestion("");
        setProcessingStep(0);
      } else {
        setCurrentQuestion(fullMsg);
      }
    } catch (err) {
      console.error(err);
      setCurrentQuestion("Sorry, something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // When the user submits an answer, send it to the assistant.
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    const newMsg: Message = { role: "user", content: trimmed };
    const newHistory: Message[] = [...messages, newMsg];
    setMessages(newHistory);
    setInput("");
    await askAssistant(newHistory);
  }

  // Advance through processing steps once we have a final answer.
  useEffect(() => {
    if (finalAnswer && processingStep !== null) {
      const atLast = processingStep >= processingSteps.length - 1;
      const timeout = setTimeout(() => {
        if (atLast) {
          setProcessingStep(null);
        } else {
          setProcessingStep((prev) => (prev === null ? null : prev + 1));
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [finalAnswer, processingStep]);

  // Reset the conversation to start over.
  function resetConversation() {
    setMessages([]);
    setCurrentQuestion("");
    setFinalAnswer("");
    setInput("");
    setProcessingStep(null);
    setLoading(false);
    setBookingInfo(null);
  }

  // Inject a spinner keyframe style when the component mounts.  We
  // cannot reference `document` at module evaluation time because
  // Next.js also runs this file on the server.  Instead, we add
  // the style in a client-side effect.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
      document.head.appendChild(styleEl);
      return () => {
        document.head.removeChild(styleEl);
      };
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "1rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <h3
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          marginBottom: "0.5rem",
          textAlign: "center",
        }}
      >
        Chat with Olivia
      </h3>
      {/* Show loading spinner while waiting for the assistant */}
      {loading ? (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <div
            style={{
              width: "2rem",
              height: "2rem",
              border: "3px solid #ddd",
              borderTopColor: "#fb923c",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          />
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.5rem" }}>
            Processing…
          </p>
        </div>
      ) : bookingInfo ? (
        /* Booking page after form submission */
        (() => {
          // Infer the body region from the report title (first word)
          let pain = 'your pain';
          const lowerTitle = bookingInfo.reportTitle.toLowerCase();
          if (lowerTitle.includes('shoulder')) pain = 'your shoulder pain';
          else if (lowerTitle.includes('knee')) pain = 'your knee pain';
          else if (lowerTitle.includes('back')) pain = 'your back pain';
          else if (lowerTitle.includes('hip')) pain = 'your hip pain';
          return (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>
                  I found the top PT in your area.
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#374151' }}>
                  Pro+Kinetix Physical Therapy &amp; Performance has 284 five-star Google reviews.
                </p>
                <p style={{ fontSize: '0.875rem', color: '#374151' }}>
                  Use the calendar below to book a time to talk to their team about {pain}.
                </p>
              </div>
              <div style={{ width: '100%', overflow: 'hidden' }}>
                <iframe
                  src="https://link.clinicalmarketer.com/widget/booking/Zcsc160T8IXDDEOrvVxB"
                  style={{ width: '100%', height: '500px', border: 'none', overflow: 'hidden' }}
                  scrolling="no"
                  id="msgsndr-calendar"
                  title="Appointment Scheduler"
                ></iframe>
              </div>
              <button
                type="button"
                onClick={resetConversation}
                style={{
                  marginTop: '1rem',
                  background: '#e5e7eb',
                  color: '#374151',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
            </>
          );
        })()
      ) : finalAnswer ? (
        /* Final answer mode: show processing cards or final report/lead form */
        processingStep !== null ? (
          <div
            style={{
              textAlign: 'center',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb',
              marginTop: '1rem',
            }}
          >
            <h4
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.25rem',
              }}
            >
              {processingSteps[processingStep].title}
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#374151' }}>
              {processingSteps[processingStep].description}
            </p>
          </div>
        ) : (
          <div>
            {/* Evaluation header */}
            <div
              style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                textTransform: 'uppercase',
                marginBottom: '0.25rem',
              }}
            >
              {determineReportTitle(finalAnswer)}
            </div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
              }}
            >
              I think I know what's going on…
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              {(() => {
                const { label, bg, text } = classifyAnswer(finalAnswer);
                return (
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '0.75rem',
                      background: bg,
                      color: text,
                      padding: '4px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    {label}
                  </span>
                );
              })()}
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.75rem' }}>
              {finalAnswer}
            </p>
            {/* Lead form section */}
            {(() => {
              // Extract the user responses and assistant questions
              const responses: string[] = messages
                .filter((m) => m.role === 'user')
                .map((m) => m.content);
              const questions: string[] = messages
                .filter((m) => m.role === 'assistant' && !m.content.startsWith('FINAL:'))
                .map((m) => m.content);
              const reportTitle = determineReportTitle(finalAnswer);
              return (
                <LeadForm
                  responses={responses}
                  finalAnswer={finalAnswer}
                  reportTitle={reportTitle}
                  questions={questions}
                  onComplete={(data) => {
                    setBookingInfo(data);
                  }}
                />
              );
            })()}
            {/* Button to restart conversation */}
            <button
              type='button'
              onClick={resetConversation}
              style={{
                marginTop: '1rem',
                background: '#e5e7eb',
                color: '#374151',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          </div>
        )
      ) : (
        /* Question input mode */
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div
            style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              marginBottom: '0.25rem',
            }}
          >
            Question
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            {currentQuestion}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Type your answer here…'
            required
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '0.5rem',
              fontSize: '0.875rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5e1',
              resize: 'vertical',
            }}
          />
          <button
            type='submit'
            style={{
              marginTop: '0.5rem',
              background: '#fb923c',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Send
          </button>
        </form>
      )}
    </div>
  );