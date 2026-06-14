import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

let _client: S3Client | null = null

function getClient(): S3Client | null {
  if (
    !process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
    !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  ) return null

  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
    })
  }
  return _client
}

export async function uploadToR2(key: string, buffer: Buffer, contentType: string): Promise<string | null> {
  const client = getClient()
  if (!client || !process.env.CLOUDFLARE_R2_BUCKET_NAME || !process.env.CLOUDFLARE_R2_PUBLIC_URL) return null

  await client.send(new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))

  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`
}

export async function deleteFromR2(url: string): Promise<void> {
  const client = getClient()
  if (!client || !process.env.CLOUDFLARE_R2_BUCKET_NAME || !process.env.CLOUDFLARE_R2_PUBLIC_URL) return

  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL
  if (!url.startsWith(publicUrl)) return
  const key = url.slice(publicUrl.length + 1)

  await client.send(new DeleteObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: key,
  }))
}

export function isR2Url(url: string): boolean {
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL
  return !!publicUrl && url.startsWith(publicUrl)
}
