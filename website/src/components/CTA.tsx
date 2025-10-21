export default function CTA() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto  bg-[#2a61bb] rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTZ2LTZoNnYtNmg2djZoNnY2aC02djZoLTZ2LTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />

          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-50">
              Ready to get started?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <button className="group shadow-lg rounded-lg hover:shadow-xl px-4 py-2  text-[#0857aa] cursor-pointer bg-gray-50">
                Start Audit
              </button>
              <button className="bg-gray-50 border-[#0857aa] text-[#0857aa] hover:cursor-pointer px-4 py-2 rounded-lg transition ">
                Schedule a Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
