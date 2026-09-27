import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  buildFinalQuizPrompt,
  buildModuleContentPrompt,
  buildOutlinePrompt,
  extractJSON,
  fallbackFinalQuiz,
  finalizeGeneratedCourse,
  sanitizeFinalQuiz,
  sanitizeModuleBatch,
  sanitizeOutline,
  topicFromPdfName,
  type AiLocale,
  type ChapterRequest,
  type CourseOutline,
  type CourseProfile,
  type DraftQuizQuestion,
  type ModuleDraft,
  type PdfReferenceInput,
} from "@/lib/ai-course";

const COSMOSHUB_URL = "https://api.cosmoshub.tech/v1/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Each request now runs ONE generation step (see POST below), which keeps it
// well inside Vercel's limit; this is headroom for a slow model on one step.
export const maxDuration = 300;

/** Which chat-completions backend one generation run talks to. */
interface AiProvider {
  name: "cosmoshub" | "groq";
  url: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}
const MAX_SKILL_LEN = 80;
const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PDF_PAGES = 30; // pages read from the PDF
const MAX_PDF_TEXT = 45_000; // chars fed to the model
const MAX_PDF_META = 10 * 1024 * 1024; // metadata we store on the course

const REASONS = new Set(["career", "business", "hobby", "school"]);
const KNOWLEDGE = new Set(["beginner", "some", "comfortable"]);
const LEARNING_EXP = new Set(["self", "course", "first"]);

/** Whitelist & trim the onboarding profile coming from the client. */
function sanitizeProfile(raw: unknown): CourseProfile | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const p = raw as Record<string, unknown>;
  const profile: CourseProfile = {};
  if (typeof p.name === "string" && p.name.trim()) {
    profile.name = p.name.trim().slice(0, 40);
  }
  if (typeof p.reason === "string" && REASONS.has(p.reason)) {
    profile.reason = p.reason;
  }
  if (typeof p.knowledgeLevel === "string" && KNOWLEDGE.has(p.knowledgeLevel)) {
    profile.knowledgeLevel = p.knowledgeLevel;
  }
  if (typeof p.learningExp === "string" && LEARNING_EXP.has(p.learningExp)) {
    profile.learningExp = p.learningExp;
  }
  const goal = Number(p.dailyGoalMinutes);
  if (Number.isFinite(goal)) {
    profile.dailyGoalMinutes = Math.min(Math.max(Math.round(goal), 1), 120);
  }
  return Object.keys(profile).length > 0 ? profile : undefined;
}

/**
 * Validate the client-uploaded PDF: must be application/pdf, <= 5 MB.
 * Returns a PdfReferenceInput with the extracted plain text (used only to
 * build the prompt — never stored), plus metadata for the Course.
 */
async function sanitizePdf(raw: unknown): Promise<PdfReferenceInput | undefined> {
  if (!raw || typeof raw !== "object") return undefined;
  const p = raw as Record<string, unknown>;
  if (typeof p.name !== "string" || p.name.trim() === "") return undefined;
  if (typeof p.data !== "string" || p.data === "") return undefined;

  const name = p.name.trim().slice(0, 100);
  const metaSize = Number(p.size);
  const size = Number.isFinite(metaSize) ? Math.round(metaSize) : 0;
  if (size > MAX_PDF_SIZE) {
    throw new PdfTooLargeError();
  }

  const mimeMatch = p.data.match(/^data:([^;]+);/);
  const mime = mimeMatch ? mimeMatch[1] : "";
  if (mime && mime !== "application/pdf") {
    throw new PdfBadTypeError();
  }

  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(p.data.replace(/^data:[^;]+;base64,/, "")), (c) =>
      c.charCodeAt(0)
    );
  } catch {
    throw new PdfBadTypeError();
  }
  if (bytes.length === 0 || bytes.length > MAX_PDF_SIZE) {
    throw new PdfTooLargeError();
  }
  // Enforce the magic header "%PDF-" on the raw bytes
  if (
    bytes.length < 5 ||
    String.fromCharCode(bytes[0], bytes[1], bytes[2]) !== "%PD" ||
    bytes[3] !== 0x46
  ) {
    throw new PdfBadTypeError();
  }

  // Extract text from the PDF via pdfjs-dist (legacy build, pure JS).
  // Whitespace is collapsed within a page, but page breaks are kept as
  // blank lines so the model can still see the document's structure.
  let text = "";
  try {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await getDocument({ data: bytes }).promise;
    try {
      const pages: string[] = [];
      for (let i = 1; i <= Math.min(doc.numPages, MAX_PDF_PAGES); i++) {
        const page = await doc.getPage(i);
        const tc = await page.getTextContent();
        const pageText = tc.items
          .map((it) => ("str" in it ? String(it.str ?? "") : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (pageText) pages.push(pageText);
      }
      text = pages.join("\n\n").slice(0, MAX_PDF_TEXT).trim();
    } finally {
      await doc.destroy();
    }
  } catch {
    text = "";
  }

  return {
    name,
    size: Math.min(size, MAX_PDF_META),
    text,
  };
}

class PdfTooLargeError extends Error {}
class PdfBadTypeError extends Error {}

// Simple in-memory rate limit (per serverless instance)
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits: number[] = [];

function rateLimited(): boolean {
  const now = Date.now();
  while (hits.length > 0 && now - hits[0] > WINDOW_MS) hits.shift();
  if (hits.length >= MAX_PER_WINDOW) return true;
  hits.push(now);
  return false;
}

class AiCallError extends Error {}

/**
 * One chat-completion call that must answer with a single JSON object.
 * Returns the extracted raw JSON; throws AiCallError on transport/API failure
 * and lets extractJSON errors bubble for invalid content.
 */
async function callAIJson(params: {
  provider: AiProvider;
  prompt: string;
}): Promise<unknown> {
  const { provider } = params;
  const body = JSON.stringify({
    model: provider.model,
    temperature: provider.temperature,
    max_tokens: provider.maxTokens,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a course generator. Always respond with a single valid JSON object only. When reference material is provided in the user message, treat it as the authoritative source for the course content.",
      },
      { role: "user", content: params.prompt },
    ],
  });

  let aiRes: Response | null = null;
  // One retry on 429 (Groq rate limits per minute), honouring Retry-After.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      aiRes = await fetch(provider.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body,
        // Never let one hung call eat the whole function budget.
        signal: AbortSignal.timeout(120_000),
      });
    } catch {
      throw new AiCallError("ai_unreachable");
    }
    if (aiRes.status !== 429 || attempt === 1) break;
    const retryAfter = Number(aiRes.headers.get("retry-after"));
    const waitMs = Math.min(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 8000, 20_000);
    console.warn(`[generate-course] ${provider.name} 429, retrying in ${waitMs}ms`);
    await new Promise((r) => setTimeout(r, waitMs));
  }
  if (!aiRes || !aiRes.ok) {
    const status = aiRes?.status ?? 0;
    const errBody = aiRes ? await aiRes.text().catch(() => "") : "";
    console.error(
      `[generate-course] ${provider.name} ai_error status=${status} body=${errBody.slice(0, 500)}`
    );
    throw new AiCallError(`ai_error_${status}`);
  }
  const data = await aiRes.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  const finishReason: string = data?.choices?.[0]?.finish_reason ?? "";
  if (!text) {
    // e.g. reasoning models returning empty content with finish_reason "length"
    console.error(
      `[generate-course] empty AI content. finish_reason=${finishReason} usage=${JSON.stringify(data?.usage ?? {})}`
    );
  }
  return extractJSON(text);
}


/* ------------------------------------------------------------------------ */
/*  Step-based generation                                                    */
/*                                                                           */
/*  One request per phase instead of one request for the whole course, so   */
/*  no single call comes near Vercel's function time limit (the old 504),   */
/*  and the browser can pace calls to stay under Groq's per-minute limits.  */
/*                                                                           */
/*    step "outline"  → course meta + 12 chapter titles  (+ extracted PDF)  */
/*    step "chapters" → lesson bodies + quizzes for ≤4 chapters             */
/*    step "finish"   → final quiz + assembled Course                        */
/* ------------------------------------------------------------------------ */

const MAX_CHAPTERS_PER_STEP = 4;

/** PDF courses use Groq when a key is configured; everything else CosmosHub. */
function pickProvider(usePdf: boolean): AiProvider | null {
  const groqKey = process.env.GROQ_API_KEY;
  if (usePdf && groqKey) {
    return {
      name: "groq",
      url: GROQ_URL,
      apiKey: groqKey,
      // Llama 4 Scout: fast, JSON mode, and a far higher free-tier
      // tokens-per-minute budget than llama-3.3-70b (whose 12k TPM limit
      // rejected PDF-sized requests outright).
      model: process.env.GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct",
      maxTokens: Number(process.env.GROQ_MAX_TOKENS) || 8000,
      temperature: 0.6,
    };
  }
  const apiKey = process.env.COSMOSHUB_API_KEY;
  if (!apiKey) return null;
  if (usePdf) console.warn("[generate-course] PDF course without GROQ_API_KEY — using CosmosHub");
  return {
    name: "cosmoshub",
    url: COSMOSHUB_URL,
    apiKey,
    model: process.env.COSMOSHUB_MODEL || "gemini-3.6-flash",
    // gemini-* models spend tokens on internal "reasoning" before producing
    // output, so the visible content needs a much larger budget than the
    // expected JSON size.
    maxTokens: Number(process.env.COSMOSHUB_MAX_TOKENS) || 16000,
    temperature: 0.7,
  };
}

/** PDF text is re-sent by the client on later steps; cap and type-check it. */
function pdfFromClientText(raw: unknown, provider: AiProvider): PdfReferenceInput | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const p = raw as Record<string, unknown>;
  if (typeof p.name !== "string" || typeof p.text !== "string") return undefined;
  const size = Number(p.size);
  return {
    name: p.name.trim().slice(0, 100),
    size: Number.isFinite(size) ? Math.min(Math.max(0, Math.round(size)), MAX_PDF_META) : 0,
    text: p.text.slice(0, pdfTextLimit(provider)),
  };
}

/** Groq bills each call's input against a per-minute token budget, so keep PDF text lean there. */
function pdfTextLimit(provider: AiProvider): number {
  return provider.name === "groq" ? Number(process.env.GROQ_PDF_MAX_CHARS) || 20_000 : MAX_PDF_TEXT;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** The outline comes back from the client between steps — re-validate its shape. */
function outlineFromClient(raw: unknown): CourseOutline | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.modules) || o.modules.length === 0 || o.modules.length > 20) return null;
  const modules = o.modules.map((m) => {
    const mo = (m ?? {}) as Record<string, unknown>;
    return {
      title: str(mo.title, 200),
      summary: str(mo.summary, 600),
      lessonTitles: (Array.isArray(mo.lessonTitles) ? mo.lessonTitles : [])
        .slice(0, 6)
        .map((t) => str(t, 200))
        .filter(Boolean),
    };
  });
  if (modules.some((m) => !m.title || m.lessonTitles.length === 0)) return null;
  return {
    title: str(o.title, 200),
    description: str(o.description, 1000),
    longDescription: str(o.longDescription, 3000),
    difficulty: str(o.difficulty, 20) || "beginner",
    salary: str(o.salary, 200),
    demand: str(o.demand, 50),
    modules,
  };
}

function draftsFromClient(raw: unknown): ModuleDraft[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 20) return null;
  const out: ModuleDraft[] = [];
  for (const d of raw) {
    const dr = (d ?? {}) as Record<string, unknown>;
    if (!Array.isArray(dr.lessons) || !Array.isArray(dr.quiz)) return null;
    out.push({
      lessons: dr.lessons.slice(0, 6).map((l) => {
        const lo = (l ?? {}) as Record<string, unknown>;
        return {
          title: str(lo.title, 200),
          duration: Math.min(Math.max(Number(lo.duration) || 5, 1), 60),
          body: str(lo.body, 20_000),
        };
      }),
      quiz: dr.quiz.slice(0, 8).map((q) => {
        const qo = (q ?? {}) as Record<string, unknown>;
        const options = (Array.isArray(qo.options) ? qo.options : []).slice(0, 4).map((x) => str(x, 300));
        return {
          question: str(qo.question, 500),
          options,
          correctIndex: Math.min(Math.max(Math.round(Number(qo.correctIndex) || 0), 0), Math.max(options.length - 1, 0)),
          explanation: str(qo.explanation, 800) || undefined,
        };
      }),
    });
  }
  return out;
}

/** Map an AI failure to a response the client can act on (429 → wait & retry). */
function aiFailure(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error("[generate-course] step failed:", msg);
  if (msg === "ai_error_429") {
    return NextResponse.json({ error: "ai_rate_limited" }, { status: 429 });
  }
  return NextResponse.json({ error: "bad_ai_output", detail: msg.slice(0, 120) }, { status: 502 });
}

export async function POST(request: Request) {
  // Require a signed-in Clerk user before spending any AI quota.
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const step = body.step === "chapters" || body.step === "finish" ? body.step : "outline";
  const locale: AiLocale = body.locale === "en" ? "en" : "id";
  const profile = sanitizeProfile(body.profile);
  let skill = String(body.skill ?? "").trim().slice(0, MAX_SKILL_LEN);

  /* ---------------- step 1: outline ---------------- */
  if (step === "outline") {
    let pdf: PdfReferenceInput | undefined;
    try {
      pdf = await sanitizePdf(body.pdf);
    } catch (e) {
      if (e instanceof PdfTooLargeError) {
        return NextResponse.json({ error: "pdf_too_large" }, { status: 413 });
      }
      return NextResponse.json({ error: "pdf_invalid" }, { status: 422 });
    }

    // A topic prompt OR an uploaded PDF is enough to build a course from.
    const hasPdfText = Boolean(pdf && pdf.text.trim().length > 0);
    if (skill.length < 3 && !hasPdfText) {
      // Scanned/image-only PDF: fall back to its file name as the topic.
      const fromName = pdf ? topicFromPdfName(pdf.name).slice(0, MAX_SKILL_LEN) : "";
      if (!fromName) {
        return NextResponse.json({ error: "invalid_skill" }, { status: 400 });
      }
      skill = fromName;
    }

    // One course = one outline call, so rate-limit here only.
    if (rateLimited()) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const provider = pickProvider(Boolean(pdf));
    if (!provider) return NextResponse.json({ error: "missing_api_key" }, { status: 500 });
    if (pdf) pdf = { ...pdf, text: pdf.text.slice(0, pdfTextLimit(provider)) };

    try {
      const outline = sanitizeOutline(
        await callAIJson({ provider, prompt: buildOutlinePrompt(skill, profile, pdf, locale) })
      );
      // The extracted text is handed back so later steps need not re-upload
      // (and re-parse) the whole PDF.
      return NextResponse.json({
        skill,
        outline,
        pdf: pdf ? { name: pdf.name, size: pdf.size, text: pdf.text } : null,
      });
    } catch (e) {
      return aiFailure(e);
    }
  }

  // Later steps carry the outline + extracted PDF text from step 1.
  const outline = outlineFromClient(body.outline);
  if (!outline) return NextResponse.json({ error: "invalid_outline" }, { status: 400 });
  const usePdf = Boolean(body.pdf);
  const provider = pickProvider(usePdf);
  if (!provider) return NextResponse.json({ error: "missing_api_key" }, { status: 500 });
  const pdf = pdfFromClientText(body.pdf, provider);

  /* ---------------- step 2: a batch of chapters ---------------- */
  if (step === "chapters") {
    const start = Math.round(Number(body.start));
    const count = Math.min(Math.max(Math.round(Number(body.count)) || MAX_CHAPTERS_PER_STEP, 1), MAX_CHAPTERS_PER_STEP);
    if (!Number.isFinite(start) || start < 0 || start >= outline.modules.length) {
      return NextResponse.json({ error: "invalid_range" }, { status: 400 });
    }
    const chapters: ChapterRequest[] = outline.modules.slice(start, start + count).map((m, i) => ({
      index: start + i + 1,
      title: m.title,
      summary: m.summary,
      lessonTitles: m.lessonTitles,
    }));
    const prompt = buildModuleContentPrompt({
      courseTitle: outline.title || skill,
      skill,
      chapters,
      allChapterTitles: outline.modules.map((m) => m.title),
      profile,
      pdf,
      locale,
    });
    try {
      const modules = sanitizeModuleBatch(
        await callAIJson({ provider, prompt }),
        chapters.length,
        outline.modules
      );
      return NextResponse.json({ modules });
    } catch (e) {
      return aiFailure(e);
    }
  }

  /* ---------------- step 3: final quiz + assemble ---------------- */
  const drafts = draftsFromClient(body.drafts);
  if (!drafts || drafts.length !== outline.modules.length) {
    return NextResponse.json({ error: "invalid_drafts" }, { status: 400 });
  }
  let finalQuiz: DraftQuizQuestion[] | null = null;
  try {
    finalQuiz = sanitizeFinalQuiz(
      await callAIJson({
        provider,
        prompt: buildFinalQuizPrompt({
          courseTitle: outline.title || skill,
          chapters: outline.modules,
          pdf,
          locale,
        }),
      })
    );
  } catch (e) {
    // Re-use real chapter questions instead of discarding the whole run.
    console.error("[generate-course] final quiz failed:", e instanceof Error ? e.message : e);
  }
  if (!finalQuiz) finalQuiz = fallbackFinalQuiz(drafts);

  const course = finalizeGeneratedCourse({ outline, drafts, finalQuiz, skill, pdf });
  return NextResponse.json({ course });
}
