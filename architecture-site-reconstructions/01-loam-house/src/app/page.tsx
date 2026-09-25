import { ContactChapter } from "@/components/chapters/ContactChapter";
import { EnquiryChapter } from "@/components/chapters/EnquiryChapter";
import { FinishesChapter } from "@/components/chapters/FinishesChapter";
import { FrameChapter } from "@/components/chapters/FrameChapter";
import { HeroChapter } from "@/components/chapters/HeroChapter";
import { PlaceChapter } from "@/components/chapters/PlaceChapter";
import { PrecinctChapter } from "@/components/chapters/PrecinctChapter";
import { EditorialEngine } from "@/components/motion/EditorialEngine";
import { BookingDialog } from "@/components/site/BookingDialog";
import { Curtain } from "@/components/site/Curtain";
import { SiteChrome } from "@/components/site/SiteChrome";
import { SiteProvider } from "@/components/site/SiteProvider";
import { CINE_CHAPTERS } from "@/content/site";

/**
 * Loam House — one long "chaptered" scroll. Each chapter rests at one viewport; motion
 * is scroll-tied and mirrored so scrolling up replays each entrance exactly.
 */
export default function Home() {
  const [proposition, size, lifestyle, penthouse, storage] = CINE_CHAPTERS;
  return (
    <SiteProvider>
      <Curtain />
      <SiteChrome />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <main id="top">
            <HeroChapter />
            <EnquiryChapter />
            <FrameChapter data={proposition} />
            <FrameChapter data={size} tall />
            <FrameChapter data={lifestyle} />
            <FrameChapter data={penthouse} />
            <FrameChapter data={storage} />
            <FinishesChapter />
            <PrecinctChapter />
            <PlaceChapter />
            <ContactChapter />
          </main>
        </div>
      </div>
      <BookingDialog />
      <EditorialEngine />
    </SiteProvider>
  );
}
