export default function Banner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-white" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-10 md:py-12">
        <div className="text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
            🐾 Claw
            <span className="text-yellow-300">123</span>
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            OpenClaw 生态导航 · 网关 · Skill · 框架 · 测评
          </p>
        </div>
      </div>
    </div>
  );
}
