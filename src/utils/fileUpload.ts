import { uploadFileToDrive } from './google-drive';

export const handleFileUpload = async (file: File | null, type: 'audio' | 'image', title?: string) => {
  if (!file) return null;

  try {
    // FormData 생성
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (title) {
      formData.append('title', title);
    }

    // 내부 API를 통해 파일 업로드 (타임아웃 60초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.error('Upload error:', errorData);
      throw new Error(errorData.error || 'Failed to upload file');
    }

    const { fileId, fileUrl, fileName } = await uploadResponse.json();

    return {
      fileId,
      fileUrl,
      fileName
    };
  } catch (error: any) {
    console.error(`Error uploading ${type} file:`, error);
    if (error.name === 'AbortError') {
      console.error('Upload timed out after 60 seconds');
    }
    return null;
  }
};
