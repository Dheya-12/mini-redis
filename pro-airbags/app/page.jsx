import Hero from '@/components/pro-airbags-hero/App';
import Header from '@/components/sections/Header';
import Ticker from '@/components/sections/Ticker';
import About from '@/components/sections/About';
import Services from '@/components/sections/Services';
import Process from '@/components/sections/Process';
import Testimonials from '@/components/sections/Testimonials';
import Faq from '@/components/sections/Faq';
import Contact from '@/components/sections/Contact';
import Footer from '@/components/sections/Footer';
import Reveals from '@/components/sections/Reveals';

export default function Page() {
  return (
    <>
      <Header />
      <Hero />
      <main className="site">
        <Ticker />
        <About />
        <Services />
        <Process />
        <Testimonials />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <Reveals />
    </>
  );
}
