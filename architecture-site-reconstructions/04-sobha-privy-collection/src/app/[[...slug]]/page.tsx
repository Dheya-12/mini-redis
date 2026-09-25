import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allRoutes, loadPage, slugForRoute } from "@/lib/content";
import { renderTree } from "@/lib/tree";
import PageEffects from "@/components/PageEffects";

type Params = Promise<{ slug?: string[] }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return allRoutes.map((r) => ({ slug: r.route === "/" ? [] : r.route.slice(1).split("/") }));
}

function resolve(slug?: string[]) {
  const route = "/" + (slug ?? []).join("/");
  const key = slugForRoute(route);
  return key ? { route, key } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const hit = resolve((await params).slug);
  if (!hit) return {};
  const doc = loadPage(hit.key);
  return {
    title: doc.title,
    description: doc.description,
    openGraph: { title: doc.title, description: doc.description, images: doc.ogImage ? [doc.ogImage] : undefined },
  };
}

export default async function Page({ params }: { params: Params }) {
  const hit = resolve((await params).slug);
  if (!hit) notFound();
  const doc = loadPage(hit.key);
  // keyed by route so client navigations remount the view (the behaviours rewrite its DOM)
  const [tag, props, ...kids] = doc.view as [string, Record<string, unknown>, ...never[]];
  return (
    <>
      {renderTree([tag, { ...(props || {}), key: hit.route, "data-route": hit.route }, ...kids])}
      <PageEffects key={hit.route} route={hit.route} />
    </>
  );
}
