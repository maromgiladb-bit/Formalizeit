import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configure S3 Client
const s3Client = new S3Client({
    region: process.env.S3_REGION!,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

/**
 * Upload a file to S3
 * @param key - S3 object key (path)
 * @param body - File buffer or stream
 * @param contentType - MIME type of the file
 */
export async function uploadToS3({
    key,
    body,
    contentType = 'application/pdf',
}: {
    key: string;
    body: Buffer | Uint8Array;
    contentType?: string;
}): Promise<void> {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    await s3Client.send(command);
}

/**
 * Generate a presigned URL for downloading an object from S3
 * @param key - S3 object key (path)
 * @param expiresInSeconds - URL expiration time in seconds (default: 5 minutes)
 * @param options.inline - When true, force the browser to render the object
 *   inline (in a new tab) rather than download it, regardless of how the stored
 *   object's Content-Disposition was set. Applied via response header overrides
 *   on the presigned URL, so it works for already-uploaded PDFs too.
 * @returns Presigned URL
 */
export async function getSignedS3Url(
    key: string,
    expiresInSeconds: number = 300,
    options?: { inline?: boolean }
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ...(options?.inline
            ? {
                  ResponseContentType: 'application/pdf',
                  ResponseContentDisposition: 'inline',
              }
            : {}),
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: expiresInSeconds,
    });

    return signedUrl;
}

/**
 * Delete an object from S3. Used by the retention cleanup cron when a
 * free-plan signed NDA passes its 5-year retention window.
 * @param key - S3 object key (path)
 */
export async function deleteFromS3(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    await s3Client.send(command);
}
