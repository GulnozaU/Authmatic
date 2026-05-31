import {
  PutObjectCommand,
  S3Client,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";

export const TIGRIS_BUCKET = process.env.TIGRIS_BUCKET ?? "authmatic-demo";

export function isTigrisConfigured(): boolean {
  return Boolean(
    process.env.TIGRIS_ACCESS_KEY_ID &&
      process.env.TIGRIS_SECRET_ACCESS_KEY &&
      process.env.TIGRIS_ENDPOINT
  );
}

export function getTigrisClient(): S3Client {
  const accessKeyId = process.env.TIGRIS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.TIGRIS_SECRET_ACCESS_KEY;
  const endpoint = process.env.TIGRIS_ENDPOINT;

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error(
      "Missing TIGRIS_ACCESS_KEY_ID, TIGRIS_SECRET_ACCESS_KEY, or TIGRIS_ENDPOINT"
    );
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: false,
  });
}

export function tigrisObjectUrl(key: string): string {
  const endpoint = (process.env.TIGRIS_ENDPOINT ?? "").replace(/\/$/, "");
  return `${endpoint}/${TIGRIS_BUCKET}/${key}`;
}

export async function uploadToTigris(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<{ key: string; url: string }> {
  const client = getTigrisClient();
  const input: PutObjectCommandInput = {
    Bucket: TIGRIS_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  };
  await client.send(new PutObjectCommand(input));
  return { key, url: tigrisObjectUrl(key) };
}
