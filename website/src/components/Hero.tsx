// import heroImage from "@/assets/hero-background.jpg";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      {/* <div
        className="absolute inset-0 bg-gradient-to-b from-background to-secondary/30"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.05,
        }}
      /> */}

      {/* Content */}
      <div className="container relative z-10 px-4 py-20 mx-auto text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0857aa]/10 text-[#0857aa] text-sm font-medium border border-[#0857aa]/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0857aa] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0857aa]"></span>
            </span>
            New: AI-Powered Code Audit Features available
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-700">
            Get Sui-Move Code Audit
            <br />
            <span className="text-[#327ac6]">With Smart Solutions</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto">
            Comprehensive smart contract security analysis powered by advanced
            AI. Detect vulnerabilities and ensure code quality.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button className="group cursor-pointer bg-[#0857aa] px-6 py-3 rounded-lg text-white font-medium shadow-lg hover:bg-[#064a8c] transition">
              Get Started Free
            </button>
            <button className="group cursor-pointer bg-transparent border border-[#0857aa] px-6 py-3 rounded-lg text-[#0857aa] font-medium hover:bg-[#0857aa]/10 transition">
              Watch Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
