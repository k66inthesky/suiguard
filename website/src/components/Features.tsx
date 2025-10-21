import { features } from "@/constants";

export default function Features() {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-700">
            With Additional Free Tools
          </h2>
        </div>

        <div className="grid md:grid-cols-2  gap-6 text-gray-700">
          {features.map((feature, i) => (
            <div
              className={`group relative overflow-hidden rounded-xl p-6 
      transition-all duration-300 hover:scale-105
     bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg hover:shadow-xl`}
              key={i}
            >
              <h3 className="text-xl font-semibold">{feature.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
