import Hero from '@/components/pro-airbags-hero/App';
import SiteHeader from '@/components/site/SiteHeader';
import Productivity from '@/components/site/Productivity';
import Insurance from '@/components/site/Insurance';
import Bento from '@/components/site/Bento';
import Cta from '@/components/site/Cta';

/* huly.io home page order: hero, Unmatched productivity + Work together, Sync with GitHub, MetaBrain + Knowledge, Join the Movement + footer. */
export default function Page() {
  return (
    <>
      <SiteHeader />
      <Hero />
      <main>
        <Productivity />
        <Insurance />
        <Bento />
        <Cta />
      </main>
    </>
  );
}
