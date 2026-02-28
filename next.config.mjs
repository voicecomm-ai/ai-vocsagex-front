/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  distDir: "build",
  swcMinify: true,
  // output: 'export',
  async rewrites() {
    // 检查是否为生产环境
    if (process.env.NODE_ENV === "production") {
      return []; // 生产环境不进行代理转发，返回空数组
    }
    return [
      { //qa配置
        source: '/voicesagex-console/:path*',      // 客户端请求路径
        destination: 'https://devvoicesagex.voicecomm.cn:7771/voicesagex-console/:path*', // 后端服务地址
        basePath: false,            // 是否包含 basePath（默认 true）
        locale: false,              // 是否包含语言前缀（默认 true）
      },
      
    ];
  },
};

export default nextConfig;
