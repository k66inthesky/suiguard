import {
  CheckCircledIcon,
  LightningBoltIcon,
  ActivityLogIcon,
  FileTextIcon,
} from '@radix-ui/react-icons';

const features = [
  {
    icon: CheckCircledIcon,
    title: 'Comprehensive Security',
    description: 'Advanced static analysis and vulnerability detection for Sui Move contracts',
  },
  {
    icon: LightningBoltIcon,
    title: 'Automated Audits',
    description: 'Fast, automated security audits with detailed reports in minutes',
  },
  {
    icon: ActivityLogIcon,
    title: 'Real-time Monitoring',
    description: 'Continuous monitoring and alerts for your deployed contracts',
  },
  {
    icon: FileTextIcon,
    title: 'Expert Review',
    description:
      'Professional security auditors verify automated findings and provide recommendations',
  },
];

export default function Features() {
  return (
    <section className="py-24 bg-white flex flex-col items-center" id="Features">
      <div className="container mx-auto px-6 flex flex-col items-center gap-10">
        <div className="text-center mb-16 flex flex-col items-center gap-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Why Choose SuiAudit
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive security solutions for your Sui blockchain projects
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-lg p-8 text-center shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-6">
                <feature.icon className="w-8 h-8 text-blue-600" />
              </div>

              <h3 className="text-xl font-semibold mt-4 mb-3 text-gray-900">{feature.title}</h3>

              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
