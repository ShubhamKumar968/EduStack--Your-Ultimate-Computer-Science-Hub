# EduStack ML & RAG Microservice 🧠

A lightweight, zero-cost, high-performance RAG (Retrieval-Augmented Generation) & AI microservice built with **FastAPI** and **Google Gemini API** (`gemini-1.5-flash`).

Designed specifically to impress tech recruiters & system design interviewers by demonstrating **Decoupled Microservice Architecture**, **Vector Search Concepts**, and **LLM RAG Orchestration**.

---

## 🌟 Key Features

1. **RAG AI Tutor (`/api/rag/ask`)**:
   - Queries CS notes/documents stored in vector memory.
   - Synthesizes accurate responses using **Google Gemini 1.5 Flash** with source citations.
2. **PYQ Question Generator (`/api/rag/generate-pyq`)**:
   - Dynamically generates university exam questions and marking schemes for any CS subject/topic.
3. **Document Indexer (`/api/rag/index`)**:
   - Index new course notes dynamically into the RAG context.
4. **Render Free-Tier Optimized**:
   - Zero heavy C++ binaries or RAM-heavy vector store overhead — consumes `< 80MB RAM` so it stays fast and responsive on Render's 512MB free instances.

---

## 🚀 How to Run Locally

### 1. Install Dependencies
```bash
cd ml_services
pip install -r requirements.txt
```

### 2. Set Up Environment Variables
Create a `.env` file inside `ml_services/`:
```env
PORT=8000
GEMINI_API_KEY=your_free_gemini_api_key
```
*(Get a free API key from [Google AI Studio](https://aistudio.google.com/))*

### 3. Run FastAPI Server
```bash
python main.py
# OR
uvicorn main.py:app --reload --port 8000
```
Open interactive Swagger API docs in your browser: `http://localhost:8000/docs`

---

## ☁️ Deployment on Render.com

1. Go to [Render Dashboard](https://dashboard.render.com/) → **New Web Service**.
2. Connect your GitHub Repository (`EduStack`).
3. Set the following settings:
   - **Root Directory**: `ml_services`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variable in Render:
   - `GEMINI_API_KEY`: *(Your key from Google AI Studio)*
