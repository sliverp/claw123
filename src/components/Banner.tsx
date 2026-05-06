export default function Banner() {
  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_28%),linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#38bdf8_100%)]">
      <div className="absolute inset-0 opacity-[0.14]">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white blur-2xl" />
        <div className="absolute -bottom-20 left-[-3rem] h-72 w-72 rounded-full bg-cyan-100 blur-2xl" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.16]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 md:py-12">
        <div className="text-center">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-blue-50 uppercase backdrop-blur-sm sm:text-xs">
            AI Agent Ecosystem Index
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
            <span className="opacity-90">Claw</span>
            <span className="ml-1 text-cyan-200">123</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-blue-50/90 sm:text-lg md:text-xl">
            OpenClaw 生态导航，聚合网关、Skill、协作框架、测评与 Token/Coding Plan。
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 text-xs text-blue-100/90 sm:text-sm">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur-sm">目录站</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur-sm">详情页</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur-sm">评分评论</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur-sm">访问统计</span>
          </div>
        </div>
      </div>
    </div>
  );
}
