export default function Banner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400">
      {/* 装饰性背景 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-white" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
            🐾 Claw
            <span className="text-yellow-300">123</span>
          </h1>
          <p className="mt-3 text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            发现和探索市面上各种 AI 网关 / 代理 / 聚合工具
          </p>
          <p className="mt-2 text-sm text-blue-200">
            点击卡片直达主页 · 悬停查看详情与评价
          </p>
        </div>
      </div>
    </div>
  );
}
