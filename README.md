# 🧠 ATS Resume Analyzer in Java

![Java](https://img.shields.io/badge/Java-Core%20%2B%20OOP-blue?logo=java)
![Apache PDFBox](https://img.shields.io/badge/Apache-PDFBox-orange?logo=apache)
![OpenNLP](https://img.shields.io/badge/NLP-OpenNLP%2FStanfordCoreNLP-green?logo=apache)
![MySQL](https://img.shields.io/badge/Database-MySQL%2FSQLite-lightgrey?logo=mysql)
![JavaFX](https://img.shields.io/badge/UI-JavaFX%2FSwing-purple?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/API-Spring%20Boot-red?logo=spring)

---

## 🎯 Objective

A Java-based application that extracts text from PDF resumes, parses skills using NLP, and compares them with job descriptions to provide a match score and actionable feedback for ATS (Applicant Tracking System) optimization.

---

## 🧩 Features

- 📄 Resume Upload & Text Extraction (PDFBox)
- 📋 JD Parsing with NLP (OpenNLP / Stanford CoreNLP)
- 🔍 Skill Matching Engine
- 📊 Match Scoring System
- ✅ Feedback & Recommendations
- 🗂️ Resume Comparison (Optional)
- 📈 GUI Dashboard or REST API (Optional)

---

## 🚀 Project Flow

```mermaid
graph TD
A[Upload Resume (PDF)] --> B[Extract Text via PDFBox]
B --> C[Store Resume Text]
D[Paste/Upload Job Description] --> E[Extract JD Keywords via NLP]
C --> F[Skill Matching Engine]
E --> F
F --> G[Scoring System]
G --> H[Feedback Generator]
H --> I[GUI Dashboard or API Output]
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Core Logic | Java (OOP, Collections) |
| PDF Parsing | Apache PDFBox |
| NLP | OpenNLP / Stanford CoreNLP |
| Database | MySQL / SQLite |
| UI (Optional) | JavaFX / Swing |
| API (Optional) | Spring Boot |
| Charts (Optional) | JFreeChart |

---

## 📂 Module Breakdown

- `PDFExtractor.java` – Extracts raw text from resumes
- `JDParser.java` – Tokenizes and tags JD content
- `SkillMatcher.java` – Compares resume vs JD keywords
- `ScoreCalculator.java` – Computes match % and feedback
- `RecommendationBuilder.java` – Suggests improvements
- `DBHandler.java` – Manages resume/JD storage
- `DashboardController.java` – GUI logic (optional)
- `ResumeController.java` – REST endpoints (optional)

---

## 📊 Sample Output

```text
✅ Strengths: Python, SQL  
❌ Missing: AWS, Deep Learning  
📈 Match Score: 50%  
💡 Recommendation: Highlight AWS projects and mention DL frameworks.
```

---

## 📁 Setup Instructions

```bash
git clone https://github.com/ARUNAGIRINATHAN-K/Java-ATS-Analyzer
cd ATS-Resume-Analyzer
# Compile and run using your preferred IDE or CLI
```

---

## 🧠 Future Enhancements

- Resume Optimizer: Suggest keyword placement
- ATS Simulation: Mimic real-world filtering
- Export Feedback: PDF/HTML reports
- Resume Comparison: Score multiple resumes for one JD
