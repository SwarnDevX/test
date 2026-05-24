"use client";

import type { ResumeData } from "@/types";

interface Props {
  data: ResumeData;
}

/* Renders the resume data as a styled white-paper HTML view —
   instant feedback without any compilation round-trip.
   Closely mimics Jake's Resume LaTeX style. */
export function ResumeHTMLPreview({ data }: Props) {
  const {
    personalInfo,
    summary,
    experience,
    education,
    skills,
    projects,
    certifications,
    publications,
    sectionOrder,
  } = data;

  const order = sectionOrder ?? [
    "summary",
    "experience",
    "education",
    "projects",
    "skills",
    "certifications",
  ];

  return (
    <div
      id="resume-preview-html"
      style={{
        fontFamily: "Times New Roman, Georgia, serif",
        fontSize: "10.5pt",
        lineHeight: 1.35,
        color: "#000",
        background: "#fff",
        padding: "0.65in 0.7in",
        minHeight: "11in",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <div
          style={{
            fontSize: "22pt",
            fontWeight: "bold",
            fontFamily: "Arial, Helvetica, sans-serif",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: "3px",
          }}
        >
          {personalInfo.name || "Your Name"}
        </div>
        <div
          style={{
            fontSize: "9pt",
            color: "#333",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0 8px",
          }}
        >
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.phone && (personalInfo.email || personalInfo.linkedin) && (
            <span style={{ color: "#888" }}>|</span>
          )}
          {personalInfo.email && (
            <span style={{ color: "#1a0dab" }}>{personalInfo.email}</span>
          )}
          {personalInfo.linkedin && (
            <>
              <span style={{ color: "#888" }}>|</span>
              <span style={{ color: "#1a0dab" }}>linkedin</span>
            </>
          )}
          {personalInfo.github && (
            <>
              <span style={{ color: "#888" }}>|</span>
              <span style={{ color: "#1a0dab" }}>github</span>
            </>
          )}
          {personalInfo.website && (
            <>
              <span style={{ color: "#888" }}>|</span>
              <span style={{ color: "#1a0dab" }}>portfolio</span>
            </>
          )}
          {personalInfo.location && (
            <>
              <span style={{ color: "#888" }}>|</span>
              <span>{personalInfo.location}</span>
            </>
          )}
        </div>
      </div>

      {/* Dynamic sections */}
      {order.map((key) => {
        switch (key) {
          case "summary":
            return summary ? (
              <Section key="summary" title="Summary">
                <p style={{ margin: 0, fontSize: "9.5pt" }}>{summary}</p>
              </Section>
            ) : null;

          case "experience":
            return experience?.length ? (
              <Section key="experience" title="Experience">
                {experience.map((exp) => (
                  <div key={exp.id} style={{ marginBottom: "7px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <span style={{ fontWeight: "bold", fontSize: "10pt" }}>
                        {exp.company}
                      </span>
                      <span style={{ fontSize: "9pt", color: "#444" }}>
                        {exp.location}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: "3px",
                      }}
                    >
                      <span
                        style={{
                          fontStyle: "italic",
                          fontSize: "9.5pt",
                          color: "#222",
                        }}
                      >
                        {exp.position}
                      </span>
                      <span style={{ fontSize: "9pt", color: "#444" }}>
                        {exp.startDate}
                        {(exp.endDate || exp.current) &&
                          ` – ${exp.current ? "Present" : exp.endDate}`}
                      </span>
                    </div>
                    <BulletList items={exp.description} />
                  </div>
                ))}
              </Section>
            ) : null;

          case "education":
            return education?.length ? (
              <Section key="education" title="Education">
                {education.map((edu) => (
                  <div key={edu.id} style={{ marginBottom: "6px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <span style={{ fontWeight: "bold", fontSize: "10pt" }}>
                        {edu.institution}
                      </span>
                      <span style={{ fontSize: "9pt", color: "#444" }}>
                        {edu.location}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <span style={{ fontStyle: "italic", fontSize: "9.5pt" }}>
                        {edu.degree}
                        {edu.field ? ` in ${edu.field}` : ""}
                        {edu.gpa ? ` — GPA: ${edu.gpa}` : ""}
                      </span>
                      <span style={{ fontSize: "9pt", color: "#444" }}>
                        {edu.startDate}
                        {edu.endDate && ` – ${edu.endDate}`}
                      </span>
                    </div>
                    {edu.courses && edu.courses.length > 0 && (
                      <div style={{ fontSize: "9pt", color: "#333", marginTop: "2px" }}>
                        <em>Relevant Courses:</em> {edu.courses.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </Section>
            ) : null;

          case "projects":
            return projects?.length ? (
              <Section key="projects" title="Projects">
                {projects.map((proj) => (
                  <div key={proj.id} style={{ marginBottom: "7px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: "2px",
                      }}
                    >
                      <span>
                        <strong style={{ fontSize: "10pt" }}>{proj.name}</strong>
                        {proj.technologies.length > 0 && (
                          <span
                            style={{
                              fontStyle: "italic",
                              fontSize: "9pt",
                              color: "#333",
                            }}
                          >
                            {" "}
                            | {proj.technologies.join(", ")}
                          </span>
                        )}
                      </span>
                    </div>
                    <BulletList items={proj.bullets} />
                  </div>
                ))}
              </Section>
            ) : null;

          case "skills":
            return skills && Object.keys(skills).length > 0 ? (
              <Section key="skills" title="Technical Skills">
                <table
                  style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5pt" }}
                >
                  <tbody>
                    {Object.entries(skills)
                      .filter(([, items]) => items.length > 0)
                      .map(([cat, items]) => (
                        <tr key={cat}>
                          <td
                            style={{
                              fontWeight: "bold",
                              paddingRight: "8px",
                              paddingBottom: "2px",
                              whiteSpace: "nowrap",
                              verticalAlign: "top",
                              width: "1%",
                            }}
                          >
                            {cat}:
                          </td>
                          <td style={{ paddingBottom: "2px", color: "#222" }}>
                            {items.join(", ")}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </Section>
            ) : null;

          case "certifications":
            return certifications?.length ? (
              <Section key="certifications" title="Certifications">
                {certifications.map((cert) => (
                  <div
                    key={cert.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "3px",
                      fontSize: "9.5pt",
                    }}
                  >
                    <span>
                      <strong>{cert.name}</strong>
                      {cert.issuer && (
                        <span style={{ color: "#444" }}> — {cert.issuer}</span>
                      )}
                    </span>
                    <span style={{ color: "#555" }}>{cert.date}</span>
                  </div>
                ))}
              </Section>
            ) : null;

          case "publications":
            return publications?.length ? (
              <Section key="publications" title="Publications">
                {publications.map((pub) => (
                  <div key={pub.id} style={{ marginBottom: "4px", fontSize: "9.5pt" }}>
                    <strong>{pub.title}</strong>
                    {pub.venue && (
                      <span style={{ color: "#444" }}> — {pub.venue}</span>
                    )}
                    {pub.date && (
                      <span style={{ color: "#666" }}>, {pub.date}</span>
                    )}
                  </div>
                ))}
              </Section>
            ) : null;

          default:
            return null;
        }
      })}
    </div>
  );
}

/* ── Helpers ── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <div
        style={{
          fontSize: "11pt",
          fontWeight: "bold",
          fontFamily: "Arial, Helvetica, sans-serif",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          borderBottom: "1.5px solid #000",
          paddingBottom: "1px",
          marginBottom: "5px",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  const filtered = items.filter(Boolean);
  if (!filtered.length) return null;
  return (
    <ul
      style={{
        margin: "2px 0 0 0",
        paddingLeft: "14px",
        fontSize: "9.5pt",
        color: "#111",
      }}
    >
      {filtered.map((item, i) => (
        <li key={i} style={{ marginBottom: "1px" }}>
          {item}
        </li>
      ))}
    </ul>
  );
}
