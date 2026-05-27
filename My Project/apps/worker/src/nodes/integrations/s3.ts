import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "integration.s3.upload",
  category: "INTEGRATION",
  label: "S3: Upload File",
  description: "Upload content to S3-compatible storage",
  icon: "Cloud",
  color: "oklch(65% 0.18 300)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "url", label: "Public URL", type: "STRING" }, { name: "key", label: "Object Key", type: "STRING" }],
  parameters: [
    { name: "credentialId", label: "S3 credential", type: "string", default: "" },
    { name: "bucket", label: "Bucket name", type: "string", default: "" },
    { name: "key", label: "Object key (path)", type: "string", default: "uploads/{{execution.id}}/file.txt" },
    { name: "content", label: "Content (expression)", type: "string", default: "{{input.content}}" },
    { name: "contentType", label: "Content-Type", type: "string", default: "text/plain" },
    { name: "endpoint", label: "Endpoint URL (for MinIO)", type: "string", default: "" },
    { name: "region", label: "Region", type: "string", default: "us-east-1" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const accessKeyId = cred.accessKeyId ?? "";
    const secretAccessKey = cred.secretAccessKey ?? "";
    const bucket = String(ctx.params.bucket ?? "");
    const key = String(ctx.resolveExpression(String(ctx.params.key ?? "file.txt")));
    const content = String(ctx.resolveExpression(String(ctx.params.content ?? "")));
    const contentType = String(ctx.params.contentType ?? "text/plain");
    const endpoint = String(ctx.params.endpoint ?? "").trim();
    const region = String(ctx.params.region ?? "us-east-1");

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — @aws-sdk/client-s3 is an optional runtime dependency
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3") as typeof import("@aws-sdk/client-s3");
    const s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
      ContentType: contentType,
    }));

    const baseUrl = endpoint
      ? `${endpoint}/${bucket}/${key}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return { url: baseUrl, key, bucket };
  },
});
