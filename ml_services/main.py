from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import uvicorn
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
# Uses zero heavy vector DB binaries so it runs smoothly on 512MB RAM free instances!
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
    
    context_text = "\n---\n".join([c.content for c in relevant_chunks])
    
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    
    if gemini_api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_api_key)
            
            prompt = f"""You are EduStack AI, an expert Computer Science tutor.
Answer the user's question accurately using ONLY the provided context notes below.
If the context does not contain enough information, state that clearly, then provide a concise standard CS answer.

Context Notes:
{context_text}

Question: {req.question}
Answer:"""

            # Dynamically fetch available models, prioritizing Gemini models
            available_models = []
            try:
                for m in genai.list_models():
                    if 'generateContent' in m.supported_generation_methods:
                        if 'gemini' in m.name.lower():
                            available_models.append(m.name)
                # Append other fallback models if needed
                for m in genai.list_models():
                    if 'generateContent' in m.supported_generation_methods and m.name not in available_models:
                        available_models.append(m.name)
            except Exception:
                pass
                
            # Default fallbacks if listing fails
            if not available_models:
                available_models = ['models/gemini-1.5-flash', 'models/gemini-2.0-flash', 'gemini-1.5-flash']
                
            response = None
            used_m = None
            last_err = None

            prompt = f"""You are EduStack AI, an expert Computer Science tutor.
Based ONLY on the provided context notes below, provide a clear, direct, concise answer to the question. Do NOT include your internal reasoning or thought process.

Context Notes:
{context_text}

Question: {req.question}

Answer:"""

            for m in available_models:
                try:
                    model = genai.GenerativeModel(m)
                    response = model.generate_content(prompt)
                    used_m = m
                    break
                except Exception as err:
                    last_err = err
                    continue

            if response and response.text:
                answer = response.text
                model_name = f"Google {used_m} (RAG)"
            else:
                raise last_err or Exception("Failed to generate content with Gemini API")
        except Exception as e:
            answer = f"Synthesized Answer (Fallback): Based on retrieved material: {context_text}"
            model_name = f"In-Memory Retrieval (Gemini API Call Failed: {str(e)})"
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
            
            # Dynamically fetch available models, prioritizing Gemini models
            available_models = []
            try:
                for m in genai.list_models():
                    if 'generateContent' in m.supported_generation_methods:
                        if 'gemini' in m.name.lower():
                            available_models.append(m.name)
                for m in genai.list_models():
                    if 'generateContent' in m.supported_generation_methods and m.name not in available_models:
                        available_models.append(m.name)
            except Exception:
                pass
                
            if not available_models:
                available_models = ['models/gemini-1.5-flash', 'models/gemini-2.0-flash', 'gemini-1.5-flash']

            response = None
            last_err = None
            
            prompt = f"""Generate {req.num_questions} university exam-style questions for Computer Science students.
Subject: {req.subject}
Topic: {req.topic}
Difficulty: {req.difficulty}

Provide response with Questions and detailed Marking Schemes/Answers for each."""

            for m in available_models:
                try:
                    model = genai.GenerativeModel(m)
                    response = model.generate_content(prompt)
                    break
                except Exception as err:
                    last_err = err
                    continue

            if not response or not response.text:
                raise last_err or Exception("Failed to generate PYQ")

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
            "questions": f"1. Explain the fundamentals of {req.topic} in {req.subject} with code examples.\n2. Compare {req.topic} with alternative approaches in real-world software engineering.",
            "note": "Set GEMINI_API_KEY for dynamic AI generation."
        }

# ── PDF Upload, Summarization & Quiz Generation Endpoints ──────────
from fastapi import UploadFile, File
import io

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
    except Exception as e:
        return ""

@app.post("/api/pdf/summarize")
async def summarize_pdf(file: UploadFile = File(...)):
    """Extract text from uploaded PDF (books/notes) and generate key takeaways & summary."""
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
        
        # Use multimodal capacity if raw text extraction from handwritten scan was sparse
        available_models = []
        try:
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    if 'gemini' in m.name.lower():
                        available_models.append(m.name)
        except Exception:
            pass
            
        if not available_models:
            available_models = ['models/gemini-1.5-flash', 'models/gemini-2.0-flash']

        prompt = f"""You are EduStack AI. Analyze the following textbook/notes document content and provide:
1. 📌 Executive Summary (2-3 paragraphs)
2. 🔑 Key Concepts & Definitions (Bullet points)
3. 💡 Important Exam Takeaways

Document Content:
{pdf_text[:10000]}"""

        response = None
        for m in available_models:
            try:
                model = genai.GenerativeModel(m)
                response = model.generate_content(prompt)
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
    """Upload a PDF book/notes and automatically generate a multiple-choice Quiz (MCQ)."""
    pdf_bytes = await file.read()
    pdf_text = extract_text_from_pdf_bytes(pdf_bytes)
    
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is required for quiz generation.")

    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_api_key)
        
        available_models = []
        try:
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods and 'gemini' in m.name.lower():
                    available_models.append(m.name)
        except Exception:
            pass
            
        if not available_models:
            available_models = ['models/gemini-1.5-flash']

        prompt = f"""You are EduStack AI. Generate an interactive Quiz with {num_questions} Multiple-Choice Questions (MCQs) based on the document text below.
For each question, provide:
- Question
- Options (A, B, C, D)
- Correct Answer
- Short Explanation

Document Content:
{pdf_text[:10000]}"""

        response = None
        for m in available_models:
            try:
                model = genai.GenerativeModel(m)
                response = model.generate_content(prompt)
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
