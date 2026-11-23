'use client';

import { generateUploadButton, generateUploadDropzone } from '@uploadthing/react';
import type { FileRouter } from 'uploadthing/types';

// The upload router itself (limits, auth check, callback) lives in optinex-backend
// (src/modules/uploads/routes.ts: endpoint `paymentReceipt`). The client only needs the endpoint names, and
// requests go to same-origin /api/uploadthing, which next.config.js rewrites to the backend.
export type OurFileRouter = FileRouter;

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
