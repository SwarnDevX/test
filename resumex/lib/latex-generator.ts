import type { ResumeData } from "@/types";

function esc(str: string): string {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

const PREAMBLE = `\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{
  \\item\\small{{#1 \\vspace{-2pt}}}
}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}
`;

export function generateLatex(data: ResumeData): string {
  const { personalInfo, summary, experience, education, skills, projects, certifications, publications, sectionOrder } = data;

  const sections: Record<string, string> = {};

  // Personal Info (always first)
  const contactParts: string[] = [];
  if (personalInfo.phone) contactParts.push(esc(personalInfo.phone));
  if (personalInfo.email)
    contactParts.push(`\\href{mailto:${personalInfo.email}}{\\underline{${esc(personalInfo.email)}}}`);
  if (personalInfo.linkedin)
    contactParts.push(`\\href{${personalInfo.linkedin}}{\\underline{linkedin}}`);
  if (personalInfo.github)
    contactParts.push(`\\href{${personalInfo.github}}{\\underline{github}}`);
  if (personalInfo.website)
    contactParts.push(`\\href{${personalInfo.website}}{\\underline{portfolio}}`);
  if (personalInfo.location) contactParts.push(esc(personalInfo.location));

  const heading = `\\begin{center}
  \\textbf{\\Huge \\scshape ${esc(personalInfo.name || "Your Name")}} \\\\ \\vspace{1pt}
  \\small ${contactParts.join(" $|$ ")}
\\end{center}
`;

  sections["summary"] = summary
    ? `\n%-----------SUMMARY-----------\n\\section{Summary}\n\\small ${esc(summary)}\n\\vspace{4pt}\n`
    : "";

  sections["experience"] =
    experience && experience.length > 0
      ? `\n%-----------EXPERIENCE-----------\n\\section{Experience}\n\\resumeSubHeadingListStart\n${experience
          .map(
            (exp) =>
              `  \\resumeSubheading\n    {${esc(exp.position)}}{${esc(exp.startDate)} -- ${exp.current ? "Present" : esc(exp.endDate)}}\n    {${esc(exp.company)}}{${esc(exp.location)}}\n    \\resumeItemListStart\n${exp.description
                .filter(Boolean)
                .map((d) => `      \\resumeItem{${esc(d)}}`)
                .join("\n")}\n    \\resumeItemListEnd`
          )
          .join("\n")}\n\\resumeSubHeadingListEnd\n`
      : "";

  sections["education"] =
    education && education.length > 0
      ? `\n%-----------EDUCATION-----------\n\\section{Education}\n\\resumeSubHeadingListStart\n${education
          .map(
            (edu) =>
              `  \\resumeSubheading\n    {${esc(edu.institution)}}{${esc(edu.startDate)} -- ${esc(edu.endDate)}}\n    {${esc(edu.degree)} in ${esc(edu.field)}}{${esc(edu.location)}}${
                edu.gpa || (edu.courses && edu.courses.length > 0)
                  ? `\n    \\resumeItemListStart${edu.gpa ? `\n      \\resumeItem{GPA: ${esc(edu.gpa)}}` : ""}${edu.courses && edu.courses.length > 0 ? `\n      \\resumeItem{Relevant Courses: ${edu.courses.map(esc).join(", ")}}` : ""}\n    \\resumeItemListEnd`
                  : ""
              }`
          )
          .join("\n")}\n\\resumeSubHeadingListEnd\n`
      : "";

  sections["projects"] =
    projects && projects.length > 0
      ? `\n%-----------PROJECTS-----------\n\\section{Projects}\n\\resumeSubHeadingListStart\n${projects
          .map(
            (proj) =>
              `  \\resumeProjectHeading\n    {\\textbf{${esc(proj.name)}} $|$ \\emph{${proj.technologies.map(esc).join(", ")}}}{}\n    \\resumeItemListStart\n${proj.bullets
                .filter(Boolean)
                .map((b) => `      \\resumeItem{${esc(b)}}`)
                .join("\n")}\n    \\resumeItemListEnd`
          )
          .join("\n")}\n\\resumeSubHeadingListEnd\n`
      : "";

  sections["skills"] =
    skills && Object.keys(skills).length > 0
      ? `\n%-----------TECHNICAL SKILLS-----------\n\\section{Technical Skills}\n\\begin{itemize}[leftmargin=0.15in, label={}]\n  \\small{\\item{\n${Object.entries(skills)
          .filter(([, items]) => items.length > 0)
          .map(([cat, items]) => `    \\textbf{${esc(cat)}}{: ${items.map(esc).join(", ")}} \\\\`)
          .join("\n")}\n  }}\n\\end{itemize}\n`
      : "";

  sections["certifications"] =
    certifications && certifications.length > 0
      ? `\n%-----------CERTIFICATIONS-----------\n\\section{Certifications}\n\\resumeSubHeadingListStart\n${certifications
          .map(
            (cert) =>
              `  \\resumeSubheading\n    {${esc(cert.name)}}{${esc(cert.date)}}\n    {${esc(cert.issuer)}}{}`
          )
          .join("\n")}\n\\resumeSubHeadingListEnd\n`
      : "";

  sections["publications"] =
    publications && publications.length > 0
      ? `\n%-----------PUBLICATIONS-----------\n\\section{Publications}\n\\resumeSubHeadingListStart\n${publications
          .map(
            (pub) =>
              `  \\resumeSubheading\n    {${esc(pub.title)}}{${esc(pub.date)}}\n    {${esc(pub.venue)}}{${pub.url ? `\\href{${pub.url}}{\\underline{link}}` : ""}}`
          )
          .join("\n")}\n\\resumeSubHeadingListEnd\n`
      : "";

  const order = sectionOrder ?? [
    "summary",
    "experience",
    "education",
    "projects",
    "skills",
    "certifications",
    "publications",
  ];

  const body = order.map((key) => sections[key] ?? "").join("");

  return `${PREAMBLE}\n\\begin{document}\n\n${heading}\n${body}\n\n\\end{document}`;
}

export function getDefaultResumeData(): ResumeData {
  return {
    personalInfo: {
      name: "Your Name",
      email: "your@email.com",
      phone: "+1 (555) 000-0000",
      location: "City, State",
      linkedin: "",
      github: "",
      website: "",
    },
    summary: "",
    experience: [],
    education: [],
    skills: {
      Languages: [],
      Frameworks: [],
      Tools: [],
    },
    projects: [],
    certifications: [],
    publications: [],
    sectionOrder: [
      "summary",
      "experience",
      "education",
      "projects",
      "skills",
      "certifications",
    ],
  };
}
