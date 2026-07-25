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
    num_questions: int = Field(default=3, ge=1, le=10)

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

INSTRUCTIONS FOR RESPONSE CONTENT & CODE:
1. Provide a clear, intuitive, and conceptual explanation appropriate for university exams.
2. ONLY include C++ code snippets if the subject is explicitly a programming subject (like DSA, C++, OOPs) OR if the user specifically asked for code/implementation (e.g. "write code for...", "implement...", "C++"). For theoretical concepts (like Operating Systems paging, Database concepts, Networks), focus on text, formulas, diagrams, and numerical examples rather than full C++ code unless asked.
3. If C++ code IS provided:
   - Always include `using namespace std;` at the top so you DO NOT use `std::` prefixes (e.g., use `cout`, `vector`, `string`, `endl`).
   - Wrap in ` ```cpp ` code blocks.
4. DO NOT output raw LaTeX math symbols like `$\\mathcal{{O}}(V)$` or `$\\text{{page}}$`. Write clear plain text like `O(V)` and `page_number = logical_address / page_size`.
5. Format with clean Markdown headers (`###`) and bold bullet points.

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
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if gemini_api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_api_key)
            
            models_to_try = get_available_gemini_models(genai)
            
            prompt = f"""You are EduStack AI. Generate {req.num_questions} university exam-style questions for Computer Science students.
Subject: {req.subject}
Topic: {req.topic}
Difficulty: {req.difficulty}

Formatting Rules:
1. Use clear, beautifully structured Markdown headers (`### Question 1: ...`).
2. If code solutions are included, provide them in **C++** syntax inside standard Markdown code blocks (` ```cpp `) and ALWAYS use `using namespace std;` to avoid `std::` prefixes.
3. Do NOT output raw LaTeX math formulas (like $V$ or $|E|$); use clean readable text (like V, E, O(V + E)).
4. Include detailed marking schemes for each sub-question.
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
                "topic": req.topic
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        return {
            "success": True,
            "questions": f"1. Explain the fundamentals of {req.topic} in {req.subject}.\n2. Compare {req.topic} with alternative approaches.",
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
            "filename": file.filename,
            "summary": "GEMINI_API_KEY not set. Text extracted successfully.",
            "text_length": len(pdf_text)
        }

    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_api_key)
        
        models_to_try = get_available_gemini_models(genai)

        prompt = f"""You are EduStack AI. Analyze the following textbook/notes document content and provide:
1. 📌 Executive Summary (2-3 paragraphs)
2. 🔑 Key Concepts & Definitions (Bullet points)
3. 💡 Important Exam Takeaways

Document Content:
{pdf_text[:10000]}"""

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

        return {
            "success": True,
            "filename": file.filename,
            "summary": response.text if response else "Failed to generate summary.",
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

        prompt = f"""You are EduStack AI. Generate an interactive Quiz with {num_questions} Multiple-Choice Questions (MCQs) based on the document text below.
For each question, provide:
- Question
- Options (A, B, C, D)
- Correct Answer
- Short Explanation

Document Content:
{pdf_text[:10000]}"""

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
