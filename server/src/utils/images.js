// Image storage. Uses ImageKit when IMAGEKIT_PRIVATE_KEY is set; otherwise saves files in
// server/uploads and serves them from /uploads, so products can be added without any setup.
import { randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { toFile } from '@imagekit/nodejs';

import imagekit from '../config/imagekit.js';

export const UPLOAD_DIR = fileURLToPath(new URL('../../uploads', import.meta.url));

const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

// Check the file's first bytes, not just the type the browser claimed.
const looksLikeImage = (buffer, mimetype) => {
  if (mimetype === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8;
  if (mimetype === 'image/png') return buffer.slice(1, 4).toString() === 'PNG';
  if (mimetype === 'image/webp') return buffer.slice(8, 12).toString() === 'WEBP';
  return false;
};

const publicBase = () => (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 8000}`).replace(/\/$/, '');

export const usingImageKit = () => Boolean(process.env.IMAGEKIT_PRIVATE_KEY);

export class ImageError extends Error {}

// Uploads multer files; pushes each result into `uploaded` so callers can clean up on failure.
export const uploadImages = async (files, uploaded, folder = 'products') => {
  for (const file of files) {
    if (!looksLikeImage(file.buffer, file.mimetype)) {
      throw new ImageError(`"${file.originalname}" is not a valid JPEG, PNG or WEBP image.`);
    }

    if (usingImageKit()) {
      const result = await imagekit.files.upload({
        file: await toFile(file.buffer, file.originalname),
        fileName: `${Date.now()}-${file.originalname}`,
        folder: `/sudd-shop/${folder}`,
      });
      uploaded.push({ url: result.url, fileId: result.fileId });
    } else {
      const dir = path.join(UPLOAD_DIR, folder);
      await mkdir(dir, { recursive: true });
      const name = `${Date.now()}-${randomBytes(6).toString('hex')}${EXTENSIONS[file.mimetype]}`;
      await writeFile(path.join(dir, name), file.buffer);
      uploaded.push({ url: `${publicBase()}/uploads/${folder}/${name}`, fileId: `local:${folder}/${name}` });
    }
  }
};

export const deleteImages = async (images, label = 'Image delete failed') => {
  for (const image of images) {
    const id = image?.fileId;
    // sample products use hosted photos
    if (!id || id.startsWith('sample-')) continue;
    try {
      if (id.startsWith('local:')) {
        const rel = id.slice(6);
        if (!/^[\w-]+\/[\w.-]+$/.test(rel)) continue;
        await unlink(path.join(UPLOAD_DIR, rel));
      } else {
        await imagekit.files.delete(id);
      }
    } catch (error) {
      console.error(`${label} ${id}:`, error.message);
    }
  }
};
