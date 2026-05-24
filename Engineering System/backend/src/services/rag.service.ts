import { searchDocuments, hybridSearch, indexDocument } from "../utils/embeddings.js";

export async function retrieveContext(query: string) {
  const [codeResults, errorResults] = await Promise.all([
    hybridSearch("codebase", query, 5).catch(() => []),
    hybridSearch("errors", query, 3).catch(() => []),
  ]);

  return {
    relatedCode: codeResults.map((r) => r.document),
    relatedErrors: errorResults.map((r) => r.document),
    codeMetadata: codeResults.map((r) => r.metadata),
    errorMetadata: errorResults.map((r) => r.metadata),
  };
}

export async function indexRepository(files: Array<{ path: string; content: string }>) {
  let indexed = 0;
  for (const file of files) {
    try {
      await indexDocument("codebase", file.path, file.content, {
        path: file.path,
        type: getFileType(file.path),
      });
      indexed++;
    } catch {
      // Skip files that fail to embed
    }
  }
  return indexed;
}

function getFileType(path: string): string {
  if (/\.tsx?$/.test(path)) return "typescript";
  if (/\.jsx?$/.test(path)) return "javascript";
  if (/\.py$/.test(path)) return "python";
  if (/\.java$/.test(path)) return "java";
  if (/\.go$/.test(path)) return "go";
  if (/\.rs$/.test(path)) return "rust";
  return "other";
}

