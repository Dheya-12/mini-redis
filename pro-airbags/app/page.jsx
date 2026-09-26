import Hero from '@/components/pro-airbags-hero/App';
import SiteHeader from '@/components/site/SiteHeader';
import Productivity from '@/components/site/Productivity';
import Insurance from '@/components/site/Insurance';
import Bento from '@/components/site/Bento';
import Pricing from '@/components/site/Pricing';
import Reviews from '@/components/site/Reviews';
import Faq from '@/components/site/Faq';
import Cta from '@/components/site/Cta';

export default function Page() {
  return (
    <>
      <SiteHeader />
      <Hero />
      <main>
        <Productivity />
        <Insurance />
        <Bento />
        <Pricing />
        <Reviews />
        <Faq />
        <Cta />
      </main>
    </>
  );
}
