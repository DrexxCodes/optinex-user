import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { getSessionUser } from '@/lib/auth/session';

const f = createUploadthing();

export const ourFileRouter = {
  paymentReceipt: f({ image: { maxFileSize: '4MB', maxFileCount: 1 }, pdf: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getSessionUser();
      if (!session) throw new Error('Unauthenticated.');
      return { uid: session.uid };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`[uploadthing] receipt uploaded by ${metadata.uid}: ${file.url}`);
      return { uid: metadata.uid, url: file.url };
    })
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
