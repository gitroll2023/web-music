export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // 브라우저에서는 현재 origin 사용
    return window.location.origin;
  }
  // 서버사이드에서는 환경변수나 기본값 사용
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
};

export const getApiUrl = (path: string) => {
  const baseUrl = getBaseUrl();
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${apiPath}`;
};
