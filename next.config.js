/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '50mb' // 최대 파일 크기를 50MB로 설정
    },
    responseLimit: '50mb'
  }
};

module.exports = nextConfig;
