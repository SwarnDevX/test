// ══════════════════════════════════════════════════════════
// LOG PARSER SERVICE
// Parses raw log text into structured format
// ══════════════════════════════════════════════════════════

export interface ParsedLog {
  timestamp?: string;
  level: string;
  message: string;
  stack?: string;
  file?: string;
  line?: number;
}

export function parseLogs(raw: string): ParsedLog[] {
  const lines = raw.split("\n").filter(Boolean);
  const logs: ParsedLog[] = [];
  let current: Partial<ParsedLog> | null = null;

  for (const line of lines) {
    // Match common log formats:
    // [2024-01-15T10:30:00Z] ERROR: message
    // 2024-01-15 10:30:00 ERROR message
    // ERROR: message
    const match = line.match(
      /^\[?([\d\-T:.Z\s]+)\]?\s*(ERROR|WARN|INFO|DEBUG|FATAL|CRITICAL|TRACE)[:\s]+(.+)/i
    );

    if (match) {
      if (current) logs.push(current as ParsedLog);
      current = {
        timestamp: match[1].trim(),
        level: match[2].toUpperCase(),
        message: match[3].trim(),
      };
    } else if (line.match(/^\s+at\s+/)) {
      // Stack trace line
      if (current) {
        current.stack = (current.stack || "") + line + "\n";
        const fileMatch = line.match(/\((.+?):(\d+)(?::\d+)?\)/) || line.match(/at\s+(.+?):(\d+)(?::\d+)?$/);
        if (fileMatch && !current.file) {
          current.file = fileMatch[1];
          current.line = parseInt(fileMatch[2]);
        }
      }
    } else if (/^(Error|TypeError|RangeError|ReferenceError|SyntaxError)/.test(line)) {
      if (current) logs.push(current as ParsedLog);
      current = { level: "ERROR", message: line };
    } else if (current) {
      current.message += " " + line.trim();
    } else {
      // Standalone line with no recognizable format
      current = { level: "UNKNOWN", message: line.trim() };
    }
  }

  if (current) logs.push(current as ParsedLog);
  return logs;
}

// Extract just error-level entries
export function extractErrors(logs: ParsedLog[]): ParsedLog[] {
  return logs.filter((l) => ["ERROR", "FATAL", "CRITICAL"].includes(l.level));
}

