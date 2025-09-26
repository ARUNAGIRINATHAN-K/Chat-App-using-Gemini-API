# ATS Resume Analyzer — detailed step-by-step outline

## 1) High-level architecture (components & flow)

Resume / JD upload → Ingestion & Format Detection → Text Extraction (parsers / OCR) → Preprocessing (cleaning, tokenization) → NLP Analysis (skills / titles / entities extraction) → Knowledge-base normalization (skills ontology) → Matching & Scoring Engine (keyword + semantic + fuzzy) → Result / Report / Dashboard (REST + UI).

(You can implement as a single Spring Boot app or as separated microservices: Ingest, NLP, Match, API.)

---

## 2) Tech choices (short summary / authoritative libs)

* **Document parsing / multi-format detection:** Apache Tika (wraps many parsers, auto-detect). ([tika.apache.org][1])
* **PDF text extraction:** Apache PDFBox (PDFTextStripper). ([pdfbox.apache.org][2])
* **MS Office (.doc, .docx):** Apache POI (HWPF / XWPF). ([poi.apache.org][3])
* **OCR (scanned PDFs/images):** Tesseract via **Tess4J** (Java wrapper). Tika can be configured to call Tesseract for OCR. ([GitHub][4])
* **Classic Java NLP (tokenize, sentence split, POS, NER):** Apache OpenNLP or Stanford CoreNLP. Use OpenNLP for lightweight tasks and CoreNLP when you need richer pipelines (parsing, coref). ([opennlp.apache.org][5])
* **Indexing & keyword matching / TF-IDF / BM25:** Apache Lucene (embedded) or Elasticsearch (distributed). Both use BM25 by default for ranking. ([lucene.apache.org][6])
* **Embeddings / semantic matching in Java:** Deep Java Library (DJL) can load transformer models and generate embeddings in Java (ONNX/Torch backends). Use DJL for in-process embeddings. ([Niklas Heidloff][7])
* **String similarity / fuzzy matching:** Simmetrics (or Apache Commons Text for Levenshtein/Jaro-Winkler). Use these for fuzzy skill/title matching. ([GitHub][8])
* **Skill ontologies / normalization sources:** O*NET and ESCO are public catalogs you can use to canonicalize skills & titles (downloadable). ([onetcenter.org][9])

---

## 3) Component-by-component, step-by-step

### A — Ingestion & detection

1. Accept upload (file or text paste).
2. Use **Apache Tika** `AutoDetectParser` to determine MIME/type and get preliminary metadata (author, created date) and text if possible. ([tika.apache.org][1])
3. Decide parsing strategy:

   * If `application/pdf` and PDF is text-based → use **PDFBox** for robust extraction. ([pdfbox.apache.org][2])
   * If PDF appears image/scanned or PDF text extraction returns little content → route to **Tesseract (Tess4J)** OCR. Tika can be configured to call Tesseract automatically as fallback. ([GitHub][4])
   * If `.docx` or `.doc` → use **Apache POI** `XWPFDocument`/`HWPFDocument` or let Tika call POI. ([poi.apache.org][3])

**Why Tika + PDFBox + POI + Tess4J?** Tika handles format detection and orchestration; PDFBox/POI provide best-in-class extraction for native text; Tess4J covers the OCR edge cases.

---

### B — Text extraction specifics & metadata

* Extract:

  * Full text (preserving section boundaries if possible)
  * Structural hints (headings, bullets, tables) — PDFBox can give positional info; POI gives paragraph/run structure. ([pdfbox.apache.org][2])
  * Metadata (emails, phone numbers, URLs) — extract via regex and save in structured fields.
* Save original file + extracted text + checksum into DB or object store. Keep raw text for reprocessing.

---

### C — Preprocessing (clean & normalize)

1. Lowercase, normalize whitespace and punctuation.
2. Remove boilerplate (e.g., "References available on request") heuristically.
3. Mask or separately store PII (emails/phones) — for GDPR/security reasons.
4. Sentence split & tokenization via **OpenNLP** (sentence detector + tokenizer). Use POS tagger if you will do syntactic patterns for titles/skills. ([opennlp.apache.org][5])

---

### D — NLP analysis (skills, keywords, job titles)

Approach: combine **rule/dictionary-based** + **ML-based** (NER + embeddings) for robustness.

**1. Skills & Keywords extraction**

* Maintain a canonical skills dictionary (from ESCO / O*NET + your custom additions) with synonyms and normalized IDs. ([ESCo][10])
* Techniques:

  * Exact token matching (n-grams) against the skills dictionary.
  * Lower-case + lemma matching (use lemmatizer from OpenNLP or CoreNLP).
  * Fuzzy match (Simmetrics / Jaro-Winkler / Levenshtein) to catch slight variants and typos. ([GitHub][8])
  * Contextual NER: train or fine-tune a model to detect “SKILL” spans (OpenNLP NER or CoreNLP NER). For domain specificity consider bootstrapping with distant labels from skill dictionaries. ([opennlp.apache.org][5])

**2. Job Title extraction & normalization**

* Extract title from top of resume (header) and from experience entries. Use heuristics (first non-empty line with uppercase / “Title” patterns).
* Normalize against title taxonomy (O*NET/ESCO) with fuzzy matching + embedding similarity for close matches (e.g., “SWE”, “Software Engineer II”, “Senior Engineer” → normalized canonical role). ([onetcenter.org][9])

**3. Experience, dates, and durations**

* Extract date ranges from experience entries (regex + date parser). Convert to years/months of experience per skill (search for skill terms within each job block and aggregate durations). Tools: custom date parser + CoreNLP numeric/date normalizer for robustness. ([stanfordnlp.github.io][11])

**4. Section-aware extraction**

* Weight matches found in Summary / Headline / Experience more than matches found in e.g., references or body text.

---

### E — Knowledge-base & normalization

* Build a normalized table `skills(skill_id, label, synonyms[], category, source)` seeded from ESCO and O*NET. Use this as the canonical mapping during matching. ([ESCo][10])
* Support synonyms & aliases (e.g., “Py” → “Python”, “TF” → “TensorFlow”).
* Keep a small ML-assisted mapping pipeline to expand synonyms from a corpus of resumes.

---

### F — Matching logic & scoring (concrete)

Use **hybrid scoring**: weighted combination of (A) exact/fuzzy keyword coverage, (B) semantic similarity (embeddings), (C) title & experience alignment, (D) soft-skill/education boosts.

**Suggested weights (example, tunable):**

* Skills coverage (hard skills): **60%**
* Experience (years & relevancy): **25%**
* Title match & seniority alignment: **10%**
* Education / certs / keywords in summary: **5%**

**Simple skills score:** `skills_pct = matched_skills_count / total_jd_skills * 100`

**Example calculation (digit-by-digit):**

* JD requires 10 keywords; resume matches 6 → `skills_pct = (6 / 10) * 100 = 60`
* Experience: JD asks 5 years; candidate has 4 → `exp_pct = (4 / 5) * 100 = 80` (cap at 100)
* Title match: fuzzy/semantic similarity → `title_pct = 60` (example)
  Now combine with weights:
* skills contribution = `60 * 0.6 = 36.0`
* experience contribution = `80 * 0.25 = 20.0`
* title contribution = `60 * 0.15 = 9.0`
  **Final score = 36.0 + 20.0 + 9.0 = 65.0%**

**How to compute semantic similarity:**

* Generate embeddings for JD and for resume paragraphs (via **DJL** or external embedding API). Compute cosine similarity between JD embedding vector and resume embedding (or best sentence chunk match). Use this as a soft boost (e.g., add up to +10 points if semantic similarity high). ([Niklas Heidloff][7])

**Search/IR approach (alternative / scalable):**

* Index resumes and job descriptions in **Lucene/Elasticsearch** and use BM25 / TF-IDF ranking for the JD query. Combine BM25 score with the weighted skill/experience heuristic for final ranking. ([lucene.apache.org][6])

---

### G — Implementation notes (pipeline pseudo)

1. **Controller endpoint** (Spring Boot): `/analyze` accepts file or JD text.
2. **Ingest service**: run Tika → route to PDFBox/POI/Tess4J as needed. Store extracted text. ([tika.apache.org][1])
3. **Preprocessor**: clean, sentence-split (OpenNLP). ([opennlp.apache.org][5])
4. **NLP analyzer**: run NER models, dictionary matcher against ESCO/O*NET, fuzzy matching (Simmetrics/Commons Text). ([ESCo][10])
5. **Matcher**: compute scores (keyword, BM25/TF-IDF or embedding cosine), produce top missing skills, suggested edits. Use caching + asynchronous worker if parsing is heavy.
6. **Reporter**: JSON result + optional PDF/HTML report, highlighting matched/missing keywords.

---

## 4) Data model (minimal)

* `resume(id, user_id, original_filename, extracted_text, summary, uploaded_at)`
* `experience(id, resume_id, title, company, start_date, end_date, responsibilities)`
* `skill(id, name, source, normalized_id)` (seeded from ESCO/O*NET)
* `resume_skill(resume_id, skill_id, matched_text, confidence, locations)`
* `job_description(id, text, extracted_skills, created_at)`
* `match_result(resume_id, job_id, score, breakdown_json, generated_at)`

---

## 5) Evaluation & test data

* Seed system with a curated **golden set**: 200 JD/resume pairs manually labeled for expected matches.
* Metrics: precision@k for top skills, recall for required skills, overall match accuracy, and human-rated usefulness.
* Use O*NET/ESCO for evaluation mapping (they provide canonical skill sets). ([onetcenter.org][9])

---

## 6) Performance, scale & infra

* For single-instance: embedded Lucene + DJL (CPU or GPU) works. For scale: Elasticsearch (search) + microservice for embeddings (DJL service or external API). ([lucene.apache.org][6])
* Use a queue (RabbitMQ / Kafka) for heavy parsing jobs; keep upload flow responsive.
* Cache embeddings & index documents to avoid reprocessing.

---

## 7) Security & compliance

* Treat resumes as PII: encrypt files at rest, enforce RBAC, purge raw files after X days if required. Mask emails/phones for display. (Design these controls early.)

---

## 8) Practical milestones (rough)

1. Week 1–2: PoC — upload PDF → PDFBox text extraction → show extracted text. ([pdfbox.apache.org][2])
2. Week 3: Add DOCX/ODT via POI/Tika and simple regex skill matching. ([poi.apache.org][3])
3. Week 4: Integrate OpenNLP for tokenization + simple NER. ([opennlp.apache.org][5])
4. Week 5–6: Build skills DB (ESCO/O*NET), fuzzy matching, scoring engine. ([ESCo][10])
5. Week 7–8: Add embeddings (DJL) or Elastic-based ranking, build UI + reports. ([Niklas Heidloff][7])

---

## 9) Useful implementation tips & gotchas

* **Scanned PDFs are common** — always detect and run OCR fallback. Tika + Tess4J combo makes this simpler. ([Medium][12])
* **Section detection matters** — matches in the “Experience” block should weigh more than in footers or references.
* **Synonyms & aliases**: maintain a growing synonyms table — one of the biggest real-world wins. Seed from ESCO/O*NET. ([ESCo][10])
* **Human-in-the-loop**: allow recruiters to confirm / correct weak mappings — use those corrections to re-train or expand synonyms.

---

## 10) Quick library cheat-sheet (with references)

* Apache Tika (format detection + orchestrator). ([tika.apache.org][1])
* Apache PDFBox (PDF extraction). ([pdfbox.apache.org][2])
* Apache POI (Word / Excel). ([poi.apache.org][3])
* Tess4J (Tesseract wrapper — OCR). ([GitHub][4])
* Apache OpenNLP (tokenize, sentence, NER). ([opennlp.apache.org][5])
* Stanford CoreNLP (advanced NLP: parsing, coref). ([stanfordnlp.github.io][11])
* Apache Lucene / Elasticsearch (indexing & BM25 scoring). ([lucene.apache.org][6])
* Deep Java Library (DJL) (embeddings / transformer inference). ([Niklas Heidloff][7])
* Simmetrics / Apache Commons Text (fuzzy string metrics). ([GitHub][8])
* ESCO / O*NET (skill / occupation taxonomies). ([ESCo][10])


* 1. A Spring Boot project skeleton (pom + controllers + service interfaces) wired to Tika + PDFBox + OpenNLP, or
* 2. A detailed UML/sequence diagram for the pipeline, or
* 3. A ready-to-copy scoring function + Java pseudocode implementing the example scoring formula above.


[1]: https://tika.apache.org/3.2.2/parser.html?utm_source=chatgpt.com "The Parser interface - Apache Tika"
[2]: https://pdfbox.apache.org/docs/2.0.2/javadocs/org/apache/pdfbox/text/PDFTextStripper.html?utm_source=chatgpt.com "PDFTextStripper (PDFBox reactor 2.0.2 API)"
[3]: https://poi.apache.org/components/document/?utm_source=chatgpt.com "HWPF and XWPF - Java API to Handle Microsoft Word Files"
[4]: https://github.com/nguyenq/tess4j?utm_source=chatgpt.com "nguyenq/tess4j: Java JNA wrapper for Tesseract OCR API"
[5]: https://opennlp.apache.org/?utm_source=chatgpt.com "Apache OpenNLP"
[6]: https://lucene.apache.org/core/7_0_1/core/org/apache/lucene/search/similarities/BM25Similarity.html?utm_source=chatgpt.com "BM25Similarity (Lucene 7.0.1 API)"
[7]: https://heidloff.net/article/tokenizing-text-java-vector-searches-djl/?utm_source=chatgpt.com "Tokenizing Text for Vector Searches with Java"
[8]: https://github.com/Simmetrics/simmetrics?utm_source=chatgpt.com "Simmetrics/simmetrics: Similarity or Distance Metrics, e.g. ..."
[9]: https://www.onetcenter.org/db_releases.html?utm_source=chatgpt.com "O*NET® Database Releases Archive"
[10]: https://esco.ec.europa.eu/en/use-esco/download?utm_source=chatgpt.com "Download - ESCO - European Union"
[11]: https://stanfordnlp.github.io/CoreNLP/?utm_source=chatgpt.com "Overview - CoreNLP - Stanford NLP Group"
[12]: https://medium.com/wellcome-data/how-to-parse-millions-of-pdf-documents-asynchronously-with-apache-tika-d27e06e57b22?utm_source=chatgpt.com "How to Parse Millions of PDF Documents Asynchronously ..."
