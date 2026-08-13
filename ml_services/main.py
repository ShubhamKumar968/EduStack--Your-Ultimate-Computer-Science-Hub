from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import uvicorn
import io
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="EduStack ML & RAG Microservice",
    description="High-performance, Render-ready RAG microservice for CS Study Notes, PYQ Question Generation, and AI Tutor.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Data Models ───────────────────────────────────────────────
class DocumentChunk(BaseModel):
    id: str
    content: str
    subject: str
    topic: Optional[str] = "General"
    source_url: Optional[str] = None

class RAGQueryRequest(BaseModel):
    question: str
    subject: Optional[str] = None
    top_k: int = Field(default=3, ge=1, le=10)

class RAGQueryResponse(BaseModel):
    answer: str
    sources: List[DocumentChunk]
    model_used: str

class PYQGenerationRequest(BaseModel):
    subject: str
    topic: str
    difficulty: Optional[str] = "Medium"
    num_mcqs: Optional[int] = 10
    num_theory: Optional[int] = 5
    num_questions: Optional[int] = 5

# ── In-Memory RAG Engine (Render Free-Tier Optimized) ─────────
class LightRAGStore:
    def __init__(self):
        self.documents: List[DocumentChunk] = [
            DocumentChunk(
                id="dsa-1",
                subject="Data Structures",
                topic="B-Trees",
                content="A B-Tree is a self-balancing search tree in which nodes can have more than two children. B-Trees are optimized for systems that read and write large blocks of data, such as databases and file systems."
            ),
            DocumentChunk(
                id="dbms-1",
                subject="DBMS",
                topic="ACID Properties",
                content="ACID stands for Atomicity, Consistency, Isolation, and Durability. These properties guarantee reliable processing of database transactions."
            ),
            DocumentChunk(
                id="cn-1",
                subject="Computer Networks",
                topic="TCP vs UDP",
                content="TCP is a connection-oriented protocol that guarantees delivery and order of packets. UDP is a connectionless protocol that provides low-latency transmission without guaranteed delivery."
            )
        ]

    def add_document(self, doc: DocumentChunk):
        self.documents.append(doc)

    def retrieve(self, query: str, subject: Optional[str] = None, top_k: int = 3) -> List[DocumentChunk]:
        query_words = set(query.lower().split())
        scored_docs = []

        for doc in self.documents:
            if subject and doc.subject.lower() != subject.lower():
                continue
            
            doc_words = set(doc.content.lower().split())
            intersection = query_words.intersection(doc_words)
            score = len(intersection) / (len(query_words) + 1e-5)
            
            scored_docs.append((score, doc))

        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [doc for score, doc in scored_docs[:top_k]]

rag_store = LightRAGStore()

# ── Helper for Gemini Model Selection ────────────────────────
def get_available_gemini_models(genai):
    available = []
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                if 'gemini' in m.name.lower():
                    available.append(m.name)
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods and m.name not in available:
                available.append(m.name)
    except Exception:
        pass
    if not available:
        available = ['models/gemini-1.5-flash', 'models/gemini-2.0-flash', 'gemini-1.5-flash']
    return available

# ── Routes ────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "EduStack ML & RAG Engine",
        "health": "/health",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    gemini_key_configured = bool(os.getenv("GEMINI_API_KEY"))
    return {
        "status": "healthy",
        "gemini_api_key_configured": gemini_key_configured,
        "indexed_documents": len(rag_store.documents)
    }

@app.post("/api/rag/index", response_model=dict)
def index_document(doc: DocumentChunk):
    rag_store.add_document(doc)
    return {"success": True, "message": f"Document '{doc.id}' indexed successfully!"}

@app.post("/api/rag/ask", response_model=RAGQueryResponse)
def ask_ai_tutor(req: RAGQueryRequest):
    relevant_chunks = rag_store.retrieve(req.question, subject=req.subject, top_k=req.top_k)
    context_text = "\n---\n".join([c.content for c in relevant_chunks if c.content])
    
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    
    if gemini_api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_api_key)
            
            models_to_try = get_available_gemini_models(genai)
            
            prompt = f"""You are EduStack AI, an expert Computer Science academic tutor for university engineering students.

SUBJECT: {req.subject}
QUESTION: {req.question}

FORMATTING & STYLE RULES:
1. DO NOT output dollar signs ($ or $$) or raw LaTeX code (like \\text, \\in, \\ge, \\ceil, \\log). Write equations and formulas in clean, readable plain text (e.g. `O(log n)`, `Balance Factor = Height(Left) - Height(Right)`, `K in {-1, 0, 1}`).
2. USE MARKDOWN TABLES: Whenever presenting algorithm complexities, formulas, or key concepts, present them using clean Markdown Tables (e.g. `| Concept / Operation | Complexity | Description |`).
3. ONLY include C++ code snippets if the subject is explicitly a programming subject (like DSA, C++, OOPs) OR if requested. Use `using namespace std;` to avoid `std::` prefixes.
4. Format with clean Markdown headers (`###`) and bold bullet points.

Context Notes from Course Material:
{context_text if context_text else 'General Computer Science Academic Knowledge'}

Answer:"""

            response = None
            used_m = None
            last_err = None

            for m in models_to_try:
                try:
                    model = genai.GenerativeModel(m)
                    res = model.generate_content(prompt)
                    if res and res.text:
                        response = res
                        used_m = m
                        break
                except Exception as err:
                    last_err = err
                    continue

            if response and response.text:
                answer = response.text
                model_name = f"Google {used_m} (RAG)"
            else:
                answer = f"Synthesized Answer: Based on {req.subject} fundamentals regarding '{req.question}'."
                model_name = "EduStack Knowledge Base"
        except Exception as e:
            answer = f"Error generating answer: {str(e)}"
            model_name = "Error Fallback"
    else:
        answer = f"Retrieved Context for your query:\n\n{context_text}\n\n(Note: Set GEMINI_API_KEY in .env for full LLM answers)"
        model_name = "In-Memory Semantic Search"

    return RAGQueryResponse(
        answer=answer,
        sources=relevant_chunks,
        model_used=model_name
    )

@app.post("/api/rag/generate-pyq")
def generate_pyq(req: PYQGenerationRequest):
    num_mcqs = req.num_mcqs or 10
    num_theory = req.num_theory or (req.num_questions or 5)

    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if gemini_api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_api_key)
            
            models_to_try = get_available_gemini_models(genai)
            
            prompt = f"""You are EduStack AI, an expert Computer Science professor creating an official University Exam & Practice Quiz paper.

SUBJECT: {req.subject}
TOPIC: {req.topic}
DIFFICULTY: {req.difficulty}
NUMBER OF MCQs TO GENERATE: {num_mcqs}
NUMBER OF THEORETICAL / NUMERICAL QUESTIONS TO GENERATE: {num_theory}

CRITICAL PAPER STRUCTURE REQUIREMENTS:

============================================================
SECTION 1: MULTIPLE CHOICE PRACTICE QUIZ ({num_mcqs} Questions)
============================================================
Generate exactly {num_mcqs} Multiple Choice Questions (MCQs).
For EVERY single MCQ, follow this EXACT Markdown structure so students can interactively test their knowledge:

### MCQ 1: [Short Topic Title]
**Question**: [Write the full, complete question sentence here — e.g. "Which layer of the OSI model is responsible for data translation and encryption?"]
- **Option A**: [Option A Text]
- **Option B**: [Option B Text]
- **Option C**: [Option C Text]
- **Option D**: [Option D Text]
> **Correct Answer**: Option [A/B/C/D]
> **Explanation**: [1-2 sentence detailed conceptual explanation.]

============================================================
SECTION 2: THEORETICAL & NUMERICAL EXAM PYQs ({num_theory} Questions)
============================================================
Generate exactly {num_theory} comprehensive, university-level theoretical and numerical exam questions with detailed solutions and visual diagrams.

For EVERY Theoretical / Numerical question:
1. **Title & Problem Statement**: Clear academic/engineering question statement (including realistic numerical values).
2. **Visual Diagram / ASCII Illustration**: Provide a clear ASCII art diagram, tree/graph layout, memory layout table, or flowchart (`[Node A] -> [Node B]`, matrix grid, memory table) whenever helpful for exam visualization.
3. **Step-by-Step Solution & Calculations**: Provide full numerical derivation or theoretical explanation divided into clear readable paragraphs.
4. **C++ Code Solution (if applicable to topic)**: Provide C++ implementation wrapped in ```cpp code blocks with `using namespace std;`.
5. **Exam Marking Scheme**: Breakdown of marks (e.g. `[2 Marks: Diagram, 3 Marks: Formula, 5 Marks: Solution]`).

STRICT NO-LATEX & DOLLAR SIGN RULE:
- ABSOLUTELY DO NOT use dollar signs ($ or $$) or raw LaTeX syntax (\\text, \\in, \\ge, \\ceil, \\log).
- Write all math, formulas, and complexities as clean, readable plain text (e.g. `O(V + E)`, `Balance Factor = Height(Left) - Height(Right)`, `ceil(m/2)`).
- Use generous paragraph spacing and bold subheadings so the content is super readable and attractive!
"""

            response = None
            for m in models_to_try:
                try:
                    model = genai.GenerativeModel(m)
                    res = model.generate_content(prompt)
                    if res and res.text:
                        response = res
                        break
                except Exception:
                    continue

            if not response or not response.text:
                raise Exception("Failed to generate PYQ with available models.")

            return {
                "success": True,
                "questions": response.text,
                "subject": req.subject,
                "topic": req.topic,
                "num_mcqs": num_mcqs,
                "num_theory": num_theory
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        return {
            "success": True,
            "questions": f"### MCQ 1: Fundamentals of {req.topic}\n- **Option A**: Option A\n- **Option B**: Option B\n- **Option C**: Option C\n- **Option D**: Option D\n> **Correct Answer**: Option A\n> **Explanation**: Explanation here.",
            "note": "Set GEMINI_API_KEY for dynamic AI generation."
        }

# ── PDF Upload, Summarization & Quiz Generation Endpoints ──────────
def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        extracted_text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                extracted_text += t + "\n"
        return extracted_text.strip()
    except Exception:
        return ""

@app.post("/api/pdf/summarize")
async def summarize_pdf(file: UploadFile = File(...)):
    pdf_bytes = await file.read()
    pdf_text = extract_text_from_pdf_bytes(pdf_bytes)
    
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        return {
            "success": False,
            "filename": file.filename,
            "summary": "GEMINI_API_KEY not set in environment. Text extracted successfully.",
            "text_length": len(pdf_text)
        }

    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_api_key)
        
        models_to_try = get_available_gemini_models(genai)

        prompt_instruction = """You are EduStack AI. Analyze the uploaded textbook/notes document content (typed or handwritten notes, diagrams, equations) and provide an executive, highly structured, student-friendly study summary.

POINT-BY-POINT & PARAGRAPH FORMATTING REQUIREMENTS:
1. 📌 Executive Overview: Provide 2-3 short, well-spaced paragraphs separated by blank lines. Keep sentences punchy and easy to read.
2. 🔑 Core Concepts & Definitions: Present all concepts as **bullet points** (point-by-point form) with bold terms for maximum legibility.
3. ⚡ Algorithm Complexities & Formulas: MUST be presented in a clean Markdown Table (`| Concept / Operation | Complexity | Description |`).
4. 💡 Key Exam Takeaways: Use bullet points for quick revision.

STRICT READABILITY & NO-LATEX RULES:
- NEVER generate dense walls of text. Always separate paragraphs and bullet points with double line breaks.
- ABSOLUTELY DO NOT use dollar signs ($ or $$) or raw LaTeX code (like \\text{}, \\in, \\ge, \\ceil, \\log).
- Write all equations and complexities as clean, readable plain text (e.g. `O(log n)`, `Balance Factor = Height(Left) - Height(Right)`)."""

        # If extracted text is rich (> 50 chars), use text context; otherwise pass PDF inline data for Gemini Vision OCR
        if len(pdf_text) > 50:
            contents = [f"{prompt_instruction}\n\nDocument Content:\n{pdf_text[:10000]}"]
        else:
            contents = [{"mime_type": "application/pdf", "data": pdf_bytes}, prompt_instruction]

        response = None
        for m in models_to_try:
            try:
                model = genai.GenerativeModel(m)
                res = model.generate_content(contents)
                if res and res.text:
                    response = res
                    break
            except Exception:
                continue

        # Fallback to text prompt if multimodal failed
        if not response and len(pdf_text) > 0:
            fallback_contents = [f"{prompt_instruction}\n\nDocument Content:\n{pdf_text[:10000]}"]
            for m in models_to_try:
                try:
                    model = genai.GenerativeModel(m)
                    res = model.generate_content(fallback_contents)
                    if res and res.text:
                        response = res
                        break
                except Exception:
                    continue

        return {
            "success": True,
            "filename": file.filename,
            "summary": response.text if response else "Failed to generate summary from PDF.",
            "characters_extracted": len(pdf_text)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Processing Error: {str(e)}")

@app.post("/api/pdf/generate-quiz")
async def generate_quiz_from_pdf(num_questions: int = 5, file: UploadFile = File(...)):
    pdf_bytes = await file.read()
    pdf_text = extract_text_from_pdf_bytes(pdf_bytes)
    
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is required for quiz generation.")

    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_api_key)
        
        models_to_try = get_available_gemini_models(genai)

        prompt_instruction = f"""You are EduStack AI. Generate an interactive Quiz with {num_questions} Multiple-Choice Questions (MCQs) based on the document below (typed or handwritten notes).
For each question, provide:
- Question
- Options (A, B, C, D)
- Correct Answer
- Short Explanation"""

        if len(pdf_text) > 50:
            contents = [f"{prompt_instruction}\n\nDocument Content:\n{pdf_text[:10000]}"]
        else:
            contents = [{"mime_type": "application/pdf", "data": pdf_bytes}, prompt_instruction]

        response = None
        for m in models_to_try:
            try:
                model = genai.GenerativeModel(m)
                res = model.generate_content(contents)
                if res and res.text:
                    response = res
                    break
            except Exception:
                continue

        if not response and len(pdf_text) > 0:
            fallback_contents = [f"{prompt_instruction}\n\nDocument Content:\n{pdf_text[:10000]}"]
            for m in models_to_try:
                try:
                    model = genai.GenerativeModel(m)
                    res = model.generate_content(fallback_contents)
                    if res and res.text:
                        response = res
                        break
                except Exception:
                    continue

        return {
            "success": True,
            "filename": file.filename,
            "quiz": response.text if response else "Failed to generate quiz.",
            "num_questions": num_questions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz Generation Error: {str(e)}")

@app.on_event("startup")
def print_startup_banner():
    port = int(os.getenv("PORT", 8000))
    print(f"""
    ╔══════════════════════════════════════════════════════════════╗
    ║        🚀 EduStack ML & RAG Microservice Running!           ║
    ╠══════════════════════════════════════════════════════════════╣
    ║  📄 Interactive API Docs : http://localhost:{port}/docs      ║
    ║  📄 Alternative Redoc Docs: http://localhost:{port}/redoc     ║
    ║  💚 Health Check Endpoint : http://localhost:{port}/health    ║
    ╚══════════════════════════════════════════════════════════════╝
    """)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
