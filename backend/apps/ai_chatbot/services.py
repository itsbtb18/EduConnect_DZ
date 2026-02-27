"""
AI Chatbot Services — RAG Pipeline.
Handles document embedding, vector search, and LLM response generation.
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


class RAGService:
    """
    Retrieval-Augmented Generation service for the AI educational chatbot.
    Uses Pinecone for vector storage and OpenAI for embeddings/generation.
    """

    def __init__(self, school_id: str | None = None):
        self.school_id = school_id
        self._index = None
        self._embeddings = None

    @property
    def embeddings(self):
        """Lazy-load OpenAI embeddings model."""
        if self._embeddings is None:
            try:
                from langchain_openai import OpenAIEmbeddings

                self._embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
            except ImportError:
                logger.warning(
                    "langchain_openai not installed. "
                    "Install with: pip install langchain-openai"
                )
                raise
        return self._embeddings

    @property
    def index(self):
        """Lazy-load Pinecone index."""
        if self._index is None:
            try:
                from django.conf import settings
                from pinecone import Pinecone

                pc = Pinecone(api_key=settings.PINECONE_API_KEY)
                self._index = pc.Index(
                    getattr(settings, "PINECONE_INDEX_NAME", "educonnect")
                )
            except ImportError:
                logger.warning(
                    "pinecone-client not installed. "
                    "Install with: pip install pinecone-client"
                )
                raise
        return self._index

    def embed_text(self, text: str) -> list[float]:
        """Generate embedding vector for a text string."""
        return self.embeddings.embed_query(text)

    def embed_documents(self, documents: list[dict[str, Any]]) -> int:
        """
        Embed and upsert documents into Pinecone.

        Each document should have:
            - id: unique identifier
            - text: content to embed
            - metadata: dict with type, school_id, subject, level, etc.
        """
        vectors = []
        for doc in documents:
            embedding = self.embed_text(doc["text"])
            metadata = doc.get("metadata", {})
            metadata["text"] = doc["text"][:1000]  # Store truncated text
            if self.school_id:
                metadata["school_id"] = self.school_id
            vectors.append(
                {
                    "id": str(doc["id"]),
                    "values": embedding,
                    "metadata": metadata,
                }
            )

        # Upsert in batches of 100
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i : i + batch_size]
            self.index.upsert(vectors=batch)

        logger.info(f"Embedded {len(vectors)} documents into Pinecone")
        return len(vectors)

    def search(
        self,
        query: str,
        top_k: int = 5,
        filters: dict | None = None,
    ) -> list[dict]:
        """
        Search Pinecone for relevant documents.

        Args:
            query: User's question text.
            top_k: Number of results to return.
            filters: Pinecone metadata filter dict (e.g. {"subject": "math"}).

        Returns:
            List of matching documents with scores.
        """
        query_embedding = self.embed_text(query)

        # Build filter including school scope
        pinecone_filter = {}
        if self.school_id:
            pinecone_filter["school_id"] = self.school_id
        if filters:
            pinecone_filter.update(filters)

        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True,
            filter=pinecone_filter if pinecone_filter else None,
        )

        return [
            {
                "id": match["id"],
                "score": match["score"],
                "text": match.get("metadata", {}).get("text", ""),
                "metadata": match.get("metadata", {}),
            }
            for match in results.get("matches", [])
        ]

    def build_prompt(
        self,
        query: str,
        context_docs: list[dict],
        conversation_history: list[dict] | None = None,
        student_level: str = "",
    ) -> list[dict]:
        """
        Build the prompt messages for the LLM, including:
        - System prompt with role and rules
        - Retrieved context documents
        - Conversation history
        - Current user query
        """
        system_prompt = (
            "You are EduBot, an educational AI assistant for Algerian students. "
            "You answer questions about their school subjects following the Algerian "
            "national curriculum. Answer in the language the student uses "
            "(Arabic, French, or English). Be encouraging and pedagogical. "
            "If you don't know the answer, say so honestly.\n\n"
        )

        if student_level:
            system_prompt += f"Student level: {student_level}\n\n"

        if context_docs:
            system_prompt += "Relevant context from school materials:\n"
            for i, doc in enumerate(context_docs, 1):
                system_prompt += f"\n--- Document {i} ---\n{doc['text']}\n"
            system_prompt += (
                "\nUse the above context to answer the student's question. "
                "Cite specific documents when relevant."
            )

        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history (last 10 messages)
        if conversation_history:
            for msg in conversation_history[-10:]:
                messages.append(
                    {
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", ""),
                    }
                )

        messages.append({"role": "user", "content": query})
        return messages

    def generate_response(
        self,
        query: str,
        conversation_history: list[dict] | None = None,
        subject_filter: str | None = None,
        student_level: str = "",
    ) -> dict:
        """
        Full RAG pipeline: search → build prompt → generate response.

        Returns:
            dict with 'response', 'sources', 'tokens_used'.
        """
        try:
            from openai import OpenAI

            # Step 1: Retrieve relevant documents
            filters = {}
            if subject_filter:
                filters["subject"] = subject_filter

            context_docs = self.search(query, top_k=5, filters=filters or None)

            # Step 2: Build prompt
            messages = self.build_prompt(
                query=query,
                context_docs=context_docs,
                conversation_history=conversation_history,
                student_level=student_level,
            )

            # Step 3: Call OpenAI
            from django.conf import settings

            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            completion = client.chat.completions.create(
                model=getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"),
                messages=messages,
                max_tokens=1024,
                temperature=0.7,
            )

            response_text = completion.choices[0].message.content
            tokens_used = completion.usage.total_tokens if completion.usage else 0

            # Extract sources
            sources = [
                {
                    "id": doc["id"],
                    "score": doc["score"],
                    "metadata": {
                        k: v for k, v in doc["metadata"].items() if k != "text"
                    },
                }
                for doc in context_docs
                if doc["score"] > 0.7
            ]

            return {
                "response": response_text,
                "sources": sources,
                "tokens_used": tokens_used,
            }

        except ImportError:
            logger.error("openai package not installed")
            return {
                "response": (
                    "The AI assistant is not available at this time. "
                    "Please contact your administrator."
                ),
                "sources": [],
                "tokens_used": 0,
            }
        except Exception as e:
            logger.exception(f"Error generating AI response: {e}")
            return {
                "response": (
                    "I encountered an error processing your question. "
                    "Please try again later."
                ),
                "sources": [],
                "tokens_used": 0,
            }


def embed_lesson_resources(school_id: str):
    """
    Utility function to embed all lesson resources for a school.
    Called via management command or admin action.
    """
    from apps.academics.models import Lesson, Resource

    service = RAGService(school_id=school_id)

    lessons = Lesson.objects.filter(
        teacher_assignment__classroom__school_id=school_id
    ).select_related(
        "teacher_assignment__subject",
        "teacher_assignment__classroom",
    )

    documents = []
    for lesson in lessons:
        subject = lesson.teacher_assignment.subject.name
        classroom = lesson.teacher_assignment.classroom.name
        documents.append(
            {
                "id": f"lesson_{lesson.id}",
                "text": f"{lesson.title}\n\n{lesson.content or ''}",
                "metadata": {
                    "type": "lesson",
                    "subject": subject,
                    "classroom": classroom,
                    "school_id": school_id,
                },
            }
        )

    resources = Resource.objects.filter(
        lesson__teacher_assignment__classroom__school_id=school_id
    ).select_related(
        "lesson__teacher_assignment__subject",
    )

    for resource in resources:
        subject = resource.lesson.teacher_assignment.subject.name
        documents.append(
            {
                "id": f"resource_{resource.id}",
                "text": f"{resource.title}\n\n{resource.description or ''}",
                "metadata": {
                    "type": "resource",
                    "subject": subject,
                    "school_id": school_id,
                },
            }
        )

    if documents:
        count = service.embed_documents(documents)
        logger.info(
            f"Embedded {count} lesson/resource documents for school {school_id}"
        )
        return count
    return 0
