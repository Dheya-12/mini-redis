import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allRoutes, loadPage, slugForRoute } from "@/lib/content";
import { renderTree, type TreeNode } from "@/lib/tree";
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
    alternates: { canonical: hit.route },
    openGraph: { title: doc.title, description: doc.description, images: doc.ogImage ? [doc.ogImage] : undefined },
  };
}

/** Every page root gets the #main id the skip link and the behaviours look for. */
// keyed by route so client navigations remount the page tree instead of patching DOM the behaviours rewrote
function withMainId(node: TreeNode, route: string): TreeNode {
  if (typeof node === "string") return node;
  const [tag, props, ...kids] = node;
  return [tag, { ...(props || {}), id: "main", key: route }, ...kids];
}

export default async function Page({ params }: { params: Params }) {
  const hit = resolve((await params).slug);
  if (!hit) notFound();
  const doc = loadPage(hit.key);
  return (
    <>
      {renderTree(withMainId(doc.main, hit.route))}
      <PageEffects key={hit.route} route={hit.route} />
    </>
  );
}
