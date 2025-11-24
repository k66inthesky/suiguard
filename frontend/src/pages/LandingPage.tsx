import Features from '@/components/Features';
import Hero from '@/components/Hero';
// import AuditProcess from '@/components/AuditProcess';
import About from '@/components/About';
import Pricing from '@/components/Pricing';
// import Events from '@/components/Events';
// import Blog from '@/components/Blog';
// import ApiDocs from '@/components/ApiDocs';
// import Newsletter from '@/components/Newsletter';

export default function LandingPage() {
  return (
    <div className="min-h-screen min-w-screen ">
      <Hero />
      <Features />
      {/* <AuditProcess /> */}
      <About />
      <Pricing />
      {/* TODO: */}
      {/* <Events /> */}
      {/* <Blog /> */}
      {/* <ApiDocs /> */}
      {/* <Newsletter /> */}
    </div>
  );
}
