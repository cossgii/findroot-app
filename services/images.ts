import { api } from '../lib/api';

export async function getUploadUrl(fileName: string): Promise<{ signedUrl: string; publicUrl: string }> {
  const { data } = await api.post('/api/images/upload', { fileName });
  return data;
}

export async function uploadImage(localUri: string, fileName: string): Promise<string> {
  const { signedUrl, publicUrl } = await getUploadUrl(fileName);

  const response = await fetch(localUri);
  const blob = await response.blob();

  await fetch(signedUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': blob.type || 'image/jpeg' },
  });

  return publicUrl;
}
