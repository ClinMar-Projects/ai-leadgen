"use client";

import { useEffect, useRef, useState } from "react";
// import the icon() function to convert FontAwesome definitions to SVG strings
// Note: We avoid importing @fortawesome modules here because they are
// not installed in all environments.  Instead, we embed the SVG
// markup for each icon directly in the processing steps array.  The
// markup was generated from FontAwesome and includes a style for
// consistent colouring.
import LeadForm from "../components/LeadForm";

// Define a simple message type for the conversation
type Message = {
  role: "system" | "assistant" | "user";
  content: string;
};

/**
 * The main page component.  Users can enter a question and receive a
 * streaming answer from the backend.  The UI is deliberately simple
 * and mobile-friendly.  It includes a form, a display area for the
 * streaming answer, and a footer with a disclaimer.
 */
export default function Page() {
  const [stage, setStage] = useState<"welcome" | "type" | "talk-setup" | "talk">(
    "welcome"
  );
  // Maintain the conversation history
  const [messages, setMessages] = useState<Message[]>([]);
  // The current question from the assistant to the user
  const [currentQuestion, setCurrentQuestion] = useState("");
  // The final answer from the assistant once enough info is gathered
  const [finalAnswer, setFinalAnswer] = useState("");
  // The user's current input
  const [input, setInput] = useState("");
  // Whether the system is waiting for a response
  const [loading, setLoading] = useState(false);
  // Whether the browser is currently listening for speech input
  const [isRecording, setIsRecording] = useState(false);
  // Ref for scrolling the answer area (not used currently but kept for potential future use)
  const boxRef = useRef<HTMLDivElement>(null);

  // System prompt describing how the assistant should behave.
  const CONVO_PROMPT =
    "You are a helpful orthopedic injury assistant. Ask the user a series of specific, clear, concise questions (e.g. location of pain, when it started, severity, activities that make it better or worse) to understand their injury, one at a time. Do not apologise or ask generic questions like 'Can you provide more information'; instead ask targeted questions to gather the details you need. Only ask one question at a time. Once you have enough information to provide insight on what is likely going on and suggest next steps, give your response prefaced with 'FINAL:' and stop asking questions.";

  // Predefined first question shown immediately when the conversation starts
  const INITIAL_QUESTION =
    "Tell me about the pain you are experiencing.";

  // Steps shown after the assistant provides its final answer but
  // before the detailed evaluation report.  Each object defines
  // a title, description and corresponding icon.  The title text
  // uses gradient colours in the UI and the description gives
  // additional context to reassure the user about the evaluation
  // process.  The last step references Olivia by name.
  const processingSteps = [
    {
      title: "Applying clinical assessment logic",
      description: "Validated screening methods and diagnostic protocols.",
      svg:
        `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="microscope" class="svg-inline--fa fa-microscope" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="color: #fb7185;"><path fill="currentColor" d="M160 32c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32c17.7 0 32 14.3 32 32l0 224c0 17.7-14.3 32-32 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32c-17.7 0-32-14.3-32-32l0-224c0-17.7 14.3-32 32-32zM32 448l288 0c70.7 0 128-57.3 128-128s-57.3-128-128-128l0-64c106 0 192 86 192 192c0 49.2-18.5 94-48.9 128l16.9 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-160 0L32 512c-17.7 0-32-14.3-32-32s14.3-32 32-32zm80-64l192 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-192 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z"></path></svg>`,
    },
    {
      title: "Focusing on real‑world answers",
      description: "Practical guidance for everyday health concerns and conditions.",
      svg:
        `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="bullseye" class="svg-inline--fa fa-bullseye" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="color: #fb7185;"><path fill="currentColor" d="M448 256A192 192 0 1 0 64 256a192 192 0 1 0 384 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 80a80 80 0 1 0 0-160 80 80 0 1 0 0 160zm0-224a144 144 0 1 1 0 288 144 144 0 1 1 0-288zM224 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"></path></svg>`,
    },
    {
      title: "Pulling from top‑tier sources",
      description: "Cochrane, NIH, medical journals, and clinical databases.",
      svg:
        `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="database" class="svg-inline--fa fa-database" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="color: #fb7185;"><path fill="currentColor" d="M448 80l0 48c0 44.2-100.3 80-224 80S0 172.2 0 128L0 80C0 35.8 100.3 0 224 0S448 35.8 448 80zM393.2 214.7c20.8-7.4 39.9-16.9 54.8-28.6L448 288c0 44.2-100.3 80-224 80S0 332.2 0 288L0 186.1c14.9 11.8 34 21.2 54.8 28.6C99.7 230.7 159.5 240 224 240s124.3-9.3 169.2-25.3zM0 346.1c14.9 11.8 34 21.2 54.8 28.6C99.7 390.7 159.5 400 224 400s124.3-9.3 169.2-25.3c20.8-7.4 39.9-16.9 54.8-28.6l0 85.9c0 44.2-100.3 80-224 80S0 476.2 0 432l0-85.9z"></path></svg>`,
    },
    {
      title: "Translating into plain English",
      description: "Medical clarity without the medical speak.",
      svg:
        `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="language" class="svg-inline--fa fa-language" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" style="color: #fb7185;"><path fill="currentColor" d="M0 128C0 92.7 28.7 64 64 64l192 0 48 0 16 0 256 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64l-256 0-16 0-48 0L64 448c-35.3 0-64-28.7-64-64L0 128zm320 0l0 256 256 0 0-256-256 0zM178.3 175.9c-3.2-7.2-10.4-11.9-18.3-11.9s-15.1 4.7-18.3 11.9l-64 144c-4.5 10.1 .1 21.9 10.2 26.4s21.9-.1 26.4-10.2l8.9-20.1 73.6 0 8.9 20.1c4.5 10.1 16.3 14.6 26.4 10.2s14.6-16.3 10.2-26.4l-64-144zM160 233.2L179 276l-38 0 19-42.8zM448 164c11 0 20 9 20 20l0 4 44 0 16 0c11 0 20 9 20 20s-9 20-20 20l-2 0-1.6 4.5c-8.9 24.4-22.4 46.6-39.6 65.4c.9 .6 1.8 1.1 2.7 1.6l18.9 11.3c9.5 5.7 12.5 18 6.9 27.4s-18 12.5-27.4 6.9l-18.9-11.3c-4.5-2.7-8.8-5.5-13.1-8.5c-10.6 7.5-21.9 14-34 19.4l-3.6 1.6c-10.1 4.5-21.9-.1-26.4-10.2s.1-21.9 10.2-26.4l3.6-1.6c6.4-2.9 12.6-6.1 18.5-9.8l-12.2-12.2c-7.8-7.8-7.8-20.5 0-28.3s20.5-7.8 28.3 0l14.6 14.6 .5 .5c12.4-13.1 22.5-28.3 29.8-45L448 228l-72 0c-11 0-20-9-20-20s9-20 20-20l52 0 0-4c0-11 9-20 20-20z"></path></svg>`,
    },
    {
      title: "Screening for red flags",
      description: "Urgent or serious conditions get flagged immediately.",
      svg:
        `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="triangle-exclamation" class="svg-inline--fa fa-triangle-exclamation" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="color: #fb7185;"><path fill="currentColor" d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg>`,
    },
    {
      title: "Comparing symptom patterns",
      description: "Olivia runs hundreds of diagnostic combinations in seconds.",
      svg:
        `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chart-bar" class="svg-inline--fa fa-chart-bar" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="color: #fb7185;"><path fill="currentColor" d="M32 32c17.7 0 32 14.3 32 32l0 336c0 8.8 7.2 16 16 16l400 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L80 480c-44.2 0-80-35.8-80-80L0 64C0 46.3 14.3 32 32 32zm96 96c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-192 0c-17.7 0-32-14.3-32-32zm32 64l128 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-128 0c-17.7 0-32-14.3-32-32s14.3-32 32-32zm0 96l256 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-256 0c-17.7 0-32-14.3-32-32s14.3-32 32-32z"></path></svg>`,
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

  // Classify the final answer into a status chip with colors.  This simple
  // heuristic looks for certain keywords to decide if urgent care is needed.
  function classifyAnswer(answer: string): { label: string; bg: string; text: string } {
    const lower = answer.toLowerCase();
    // High severity: urgent or medical attention required
    if (/(urgent|doctor|seek|emergency|immediate|red flag|medical evaluation|hospital)/.test(lower)) {
      return { label: "Medical evaluation recommended", bg: "#fecaca", text: "#b91c1c" };
    }
    // Medium severity: speak with a PT or consult a therapist
    if (/(speak with|speak to|consult|pt|physical therapist|therapist)/.test(lower)) {
      return { label: "Speak with a PT", bg: "#fef9c3", text: "#92400e" };
    }
    // Default: low severity, self-care is likely appropriate
    return { label: "Self care appropriate", bg: "#d1fae5", text: "#065f46" };
  }

  // State representing the index of the current processing step being
  // displayed.  When null, the processing phase is complete and the
  // final evaluation report will be shown.  When a non-null number,
  // the corresponding item in `processingSteps` will be rendered.
  const [processingStep, setProcessingStep] = useState<number | null>(null);

  // Start the conversation when the user enters the typing flow
  useEffect(() => {
    // When entering either the type or talk stage, initialise the conversation
    if ((stage === "type" || stage === "talk") && messages.length === 0) {
      const initialMsgs: Message[] = [
        { role: "system", content: CONVO_PROMPT },
        { role: "assistant", content: INITIAL_QUESTION },
      ];
      setMessages(initialMsgs);
      setCurrentQuestion(INITIAL_QUESTION);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Helper function to call the backend with the current conversation
  async function askAssistant(msgs: Message[]) {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs }),
      });
      if (!res.ok) {
        // Read any available error text from the response.  This may
        // include upstream error details (e.g. invalid API key).  Use
        // a generic message if none is provided.
        const errText = await res.text().catch(() => "");
        throw new Error(errText || "Failed to fetch response");
      }
      // Since the API returns plain text, read it directly
      const fullMsg = (await res.text()).trim();
      // Append the assistant's message to the conversation history
      setMessages((prev) => [...prev, { role: "assistant", content: fullMsg }]);
      // Determine if this is the final answer or a new question
      if (fullMsg.startsWith("FINAL:")) {
        setFinalAnswer(fullMsg.replace(/^FINAL:\s*/, "").trim());
        setCurrentQuestion("");
        // Kick off the processing sequence.  Start at the first step.
        setProcessingStep(0);
      } else {
        setCurrentQuestion(fullMsg);
      }
    } catch (err) {
      // If there's an error, do not transition to the final screen.
      // Instead, notify the user that something went wrong and allow
      // them to try again.  We reset the current question to an error
      // prompt and leave finalAnswer unset so the conversation can
      // continue.
      console.error(err);
      setCurrentQuestion(
        "Sorry, something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // When the user submits an answer, send it to the assistant
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    // Create a properly typed message and append to the history.  We
    // explicitly annotate the role to satisfy the Message type.
    const newMsg: Message = { role: "user", content: trimmed };
    const newHistory: Message[] = [...messages, newMsg];
    setMessages(newHistory);
    setInput("");
    // Ask the assistant for the next question or final answer
    await askAssistant(newHistory);
  }

  /**
   * Request microphone permission from the browser.  This will prompt
   * the user to grant access.  If granted, we transition to the talk
   * stage and begin the conversation.  If denied, we show an alert
   * explaining that microphone access is required.  On Safari and
   * unsupported browsers, getUserMedia may not be available.
   */
  async function requestMicAccess() {
    if (typeof navigator === 'undefined') {
      alert('Microphone access is not supported in this environment.');
      return;
    }
    try {
      // Request audio-only access
      await navigator.mediaDevices.getUserMedia({ audio: true });
      // Permission granted; proceed to talk stage
      setStage('talk');
    } catch (err) {
      console.error(err);
      alert(
        'Microphone access was denied. Please allow microphone permissions or use text input instead.'
      );
    }
  }

  // Begin listening for a spoken answer from the user.  Uses the
  // Web Speech API (SpeechRecognition).  If the browser does not
  // support speech recognition, notify the user gracefully.  When
  // speech is recognised, the recognised text is appended to the
  // conversation history and sent to the assistant for the next
  // question or final answer.  While listening, a visual indicator
  // is shown via the isRecording state.
  function startRecording() {
    // Only attempt to start recording if we are in the talk stage and
    // not already recording.
    if (stage !== "talk" || isRecording) return;
    // Retrieve SpeechRecognition constructor from the window
    const SpeechRecognition =
      (typeof window !== 'undefined' && (window as any).SpeechRecognition) ||
      (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition);
    if (!SpeechRecognition) {
      alert("Sorry, your browser doesn't support speech recognition.");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => setIsRecording(true);
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        if (transcript) {
          // Update the display input for the user to see what was recognised
          setInput(transcript);
          const newMsg: Message = { role: 'user', content: transcript };
          const newHistory: Message[] = [...messages, newMsg];
          setMessages(newHistory);
          // Send to assistant; do not immediately clear the displayed input so users can see the transcript
          await askAssistant(newHistory);
        }
      };
      recognition.start();
    } catch (err) {
      console.error(err);
      alert("An error occurred while starting speech recognition.");
    }
  }

  // When a final answer is present and we are in the processing phase,
  // advance through the processing steps automatically.  Each step is
  // shown for two seconds, after which the next step is displayed.  Once
  // the last step has been shown, the state is set to null so that the
  // final evaluation report is revealed.
  useEffect(() => {
    // When a final answer exists and processingStep is defined, progress
    // through the processing sequence.  We avoid incrementing beyond
    // the last index; instead we schedule a transition to null (show
    // the final report) after the last step.
    if (finalAnswer && processingStep !== null) {
      // Determine whether we're at the last step
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

  // Render hero section when the user first visits the site.  Once
  // they select "Type Instead" or "Talk to Me", the stage changes.  We
  // no longer render the hero for the talk stage; instead the talk
  // stage shares the chat interface with type.
  if (stage === "welcome") {
    return (
      <div className="hero">
        <div className="stack-small">
          <p
            style={{
              letterSpacing: '0.1em',
              fontSize: '0.875rem',
              color: '#6b7280',
              textTransform: 'uppercase',
            }}
          >
            AI Pain Advisor
          </p>
          <h1
            style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Hi, I’m Olivia.<br /> I’ll help you understand your{' '}
            <span className="gradient-text">shoulder or knee pain</span>
          </h1>
        </div>
        <div
          className="card stack-small"
          style={{ width: '100%', maxWidth: '36rem', alignItems: 'center' }}
        >
          <p style={{ fontSize: '1.125rem', color: '#374151', textAlign: 'center' }}>
            How would you prefer to tell me about your back, knee, or shoulder pain?
          </p>
          <div className="row">
            <button
              className="btn-pill btn-gradient"
              type="button"
              onClick={() => setStage('talk-setup')}
            >
              🎤 Talk to Me
            </button>
            <button
              className="btn-pill btn-blue"
              type="button"
              onClick={() => setStage('type')}
            >
              ⌨️ Type Instead
            </button>
          </div>
          <p className="disclaimer" style={{ textAlign: 'center' }}>
            Your information is processed securely to help me understand your symptoms
          </p>
        </div>
      </div>
    );
  }

  // Render microphone permission screen when the user selects talk-to-me
  if (stage === 'talk-setup') {
    return (
      <div className="hero">
        <div className="stack-small">
          <p
            style={{
              letterSpacing: '0.1em',
              fontSize: '0.875rem',
              color: '#6b7280',
              textTransform: 'uppercase',
            }}
          >
            AI Pain Advisor
          </p>
          <h1
            style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Hi, I’m Olivia.<br /> I’ll help you understand your{' '}
            <span className="gradient-text">shoulder or knee pain</span>
          </h1>
        </div>
        <div
          className="card stack-small"
          style={{ width: '100%', maxWidth: '36rem', alignItems: 'center' }}
        >
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: '1.5rem',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '0.75rem',
            }}
          >
            I’ll need microphone access to hear you
          </h2>
          <p style={{ fontSize: '1rem', color: '#374151', textAlign: 'center', marginBottom: '1.5rem' }}>
            When you click the button below, your browser will ask for permission to access your microphone. This is needed so I can hear what you’re telling me.
          </p>
          <button
            type="button"
            className="btn-pill btn-gradient"
            onClick={requestMicAccess}
          >
            🎤 Enable Microphone
          </button>
          <button
            type="button"
            className="button button-link"
            style={{ marginTop: '1rem' }}
            onClick={() => {
              // Reset conversation state and return to welcome
              setStage('welcome');
              setMessages([]);
              setCurrentQuestion('');
              setFinalAnswer('');
              setProcessingStep(null);
              setInput('');
              setIsRecording(false);
            }}
          >
            Go Back
          </button>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', marginTop: '1.5rem' }}>
            You can also use text input if you prefer not to use your microphone
          </p>
        </div>
      </div>
    );
  }

  // Render the chat interface when the user chooses to type.
  return (
    <>
      {loading ? (
        // Show a processing screen while waiting for the assistant
        <div className="stack" style={{ alignItems: "center" }}>
          <div
            style={{
              textTransform: "uppercase",
              fontSize: "0.875rem",
              letterSpacing: "0.1em",
              color: "#6b7280",
              marginBottom: "0.5rem",
            }}
          >
            Analyzing
          </div>
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "2rem",
              fontWeight: 700,
            }}
          >
            Processing<span style={{ color: "#fb923c" }}>...</span>
          </h2>
          <div
            className="card stack-small"
            style={{
              width: "100%",
              maxWidth: "36rem",
              alignItems: "center",
            }}
          >
            <div className="spinner"></div>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                textAlign: "center",
                marginTop: "1rem",
              }}
            >
              I’m analyzing what you’ve shared
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              This will just take a moment…
            </div>
          </div>
        </div>
      ) : (
        <div className="stack" style={{ alignItems: "center" }}>
          {/* Show the question and input if we are still gathering information */}
          {finalAnswer === "" && currentQuestion && (
            stage === "type" ? (
              <div
                className="card stack-small"
                style={{ width: "100%", maxWidth: "36rem" }}
              >
                <div
                  style={{
                    textTransform: "uppercase",
                    fontSize: "0.875rem",
                    letterSpacing: "0.1em",
                    color: "#9ca3af",
                  }}
                >
                  Question
                </div>
                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "2rem",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  {currentQuestion}
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your answer here..."
                  style={{
                    width: "100%",
                    minHeight: "120px",
                    padding: "1rem",
                    fontSize: "1rem",
                    borderRadius: "12px",
                    border: "2px solid #c7d2fe",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn-pill btn-gradient"
                    onClick={handleSubmit}
                  >
                    Submit
                  </button>
                </div>
              </div>
            ) : (
              // Talk interface: show question and a record button
              <div
                className="card stack-small"
                style={{ width: "100%", maxWidth: "36rem" }}
              >
                <div
                  style={{
                    textTransform: "uppercase",
                    fontSize: "0.875rem",
                    letterSpacing: "0.1em",
                    color: "#9ca3af",
                  }}
                >
                  Question
                </div>
                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "2rem",
                    fontWeight: 600,
                    textAlign: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  {currentQuestion}
                </div>
                {/* Display the recognised transcript so the user can see what was heard */}
                {input && (
                  <div
                    style={{
                      fontSize: "1rem",
                      color: "#374151",
                      marginBottom: "1rem",
                      padding: "0.75rem",
                      background: "#f3f4f6",
                      borderRadius: "0.75rem",
                    }}
                  >
                    {input}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn-pill btn-gradient"
                    onClick={startRecording}
                    disabled={isRecording}
                  >
                    {isRecording ? 'Listening…' : '🎤 Record Answer'}
                  </button>
                </div>
              </div>
            )
          )}
          {/* Once we have a final answer, show the formatted report */}
          {/* When in processing phase, show the processing cards one after another */}
          {finalAnswer && processingStep !== null && processingStep < processingSteps.length && (
            <>
              <div
                className="card stack-small"
                style={{ width: "100%", maxWidth: "36rem", textAlign: "center" }}
              >
                {/* Top accent bar with gradient matching the card header */}
                <div
                  style={{
                    height: "0.25rem",
                    width: "100%",
                    borderTopLeftRadius: "1rem",
                    borderTopRightRadius: "1rem",
                    background: "linear-gradient(90deg, #f9a8d4, #fbbf24)",
                    marginBottom: "1rem",
                  }}
                />
                <div style={{ marginBottom: "1.5rem" }}>
                  {/* Circular icon background */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "3.5rem",
                      height: "3.5rem",
                      borderRadius: "9999px",
                      background: "rgba(249, 168, 212, 0.15)",
                      margin: "0 auto",
                    }}
                  >
                    {/* Render the embedded SVG for this processing step.  The
                    markup is defined in the processingSteps array and
                    contains its own colour styling. */}
                    <span
                      dangerouslySetInnerHTML={{
                        __html: processingSteps[processingStep].svg,
                      }}
                    />
                  </div>
                </div>
                <h3
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                    background: "linear-gradient(90deg, #f472b6, #fbbf24)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {processingSteps[processingStep].title}
                </h3>
                <p style={{ fontSize: "1rem", color: "#374151" }}>
                  {processingSteps[processingStep].description}
                </p>
              </div>
            </>
          )}
          {finalAnswer && processingStep === null && (
            <>
              {/* Header section */}
              <div
                className="stack-small"
                style={{ width: "100%", maxWidth: "36rem", textAlign: "center" }}
              >
                <p
                  style={{
                    letterSpacing: "0.1em",
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Schedule Your Professional Consultation with Wardell Performance Physical Therapy
                </p>
                <h2
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "1.75rem",
                    fontWeight: 700,
                  }}
                >
                  This AI assessment is just the beginning. Get a comprehensive evaluation and personalized treatment plan from our medical experts.
                </h2>
                <p style={{ fontSize: "1rem", color: "#374151" }}>
                  Thank you for trusting our AI-powered assessment tool with your pain concerns. Based on our conversation, I've prepared a preliminary assessment that may help you understand what's going on.
                </p>
              </div>
              {/* Evaluation card */}
              <div
                className="card stack-small"
                style={{ width: "100%", maxWidth: "36rem" }}
              >
                {/* Card header with gradient background */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "linear-gradient(90deg, #f9a8d4, #fbbf24)",
                    padding: "0.5rem 1rem",
                    borderTopLeftRadius: "1rem",
                    borderTopRightRadius: "1rem",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  <span>{determineReportTitle(finalAnswer)}</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      background: "rgba(255,255,255,0.2)",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                    }}
                  >
                    Confidential
                  </span>
                </div>
                {/* Body */}
                <div style={{ padding: "1rem" }}>
                  <div
                    style={{
                      fontSize: "1rem",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    I think I know what's going on...
                  </div>
                    {/* Status badge */}
                    <div style={{ marginBottom: "1rem" }}>
                      {(() => {
                        const { label, bg, text } = classifyAnswer(finalAnswer);
                        return (
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: "0.875rem",
                              background: bg,
                              color: text,
                              padding: "4px 8px",
                              borderRadius: "9999px",
                            }}
                          >
                            {label}
                          </span>
                        );
                      })()}
                    </div>
                    {/* CTA button */}
                    <div style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="btn-pill btn-gradient"
                        onClick={() => {
                          // Scroll to the detailed evaluation section
                          const elem = document.getElementById("details-section");
                          if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        Unlock the full evaluation below
                      </button>
                    </div>
                </div>
              </div>
              {/* Detailed section */}
              <div
                id="details-section"
                className="card stack-small"
                style={{ width: "100%", maxWidth: "36rem", marginTop: "1rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    Unlock the full evaluation to receive:
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      background: "#d1fae5",
                      color: "#065f46",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                    }}
                  >
                    FREE
                  </span>
                </div>
                <ul style={{ listStyle: "none", paddingLeft: "0.5rem", color: "#374151" }}>
                  <li style={{ marginBottom: "0.25rem" }}>• Detailed evaluation explanation</li>
                  <li style={{ marginBottom: "0.25rem" }}>• Personalized treatment recommendations</li>
                  <li style={{ marginBottom: "0.25rem" }}>• Invitation to our Shoulder Support Group with over 21,500 members</li>
                  <li style={{ marginBottom: "0.25rem" }}>• Personalized recovery recommendations for your condition</li>
                  <li style={{ marginBottom: "0.25rem" }}>• Personalized recovery timeline and expectations</li>
                  <li>• Access to recovery resources and professional advice from Wardell Performance Physical Therapy</li>
                </ul>
              </div>
              {/* Lead form for email capture.  Pass the user responses,
                  final answer and report title so the webhook receives
                  all relevant information. */}
              <div
                className="card stack-small"
                style={{ width: "100%", maxWidth: "36rem", marginTop: "1rem" }}
              >
                {(() => {
                  // Extract only the user messages from the conversation history
                  const responses: string[] = messages
                    .filter((m) => m.role === 'user')
                    .map((m) => m.content);
                  // Extract only the assistant questions (exclude system prompt and final answer)
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
                    />
                  );
                })()}
              </div>
            </>
          )}
          {/* Back link to start over */}
          <button
            type="button"
            className="button button-secondary"
            style={{ marginTop: "1.5rem" }}
            onClick={() => {
              setStage("welcome");
              // reset conversation state
              setMessages([]);
              setCurrentQuestion("");
              setFinalAnswer("");
              setInput("");
            }}
          >
            ← Back
          </button>
          <footer
            style={{
              fontSize: "0.75rem",
              color: "#6b7280",
              marginTop: "2rem",
            }}
          >
            By using this site, you agree that responses are for information
            only and not a substitute for professional medical advice.
          </footer>
        </div>
      )}
    </>
  );
}