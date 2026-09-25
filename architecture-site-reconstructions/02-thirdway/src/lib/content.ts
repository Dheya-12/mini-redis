import fs from "node:fs";
import path from "node:path";
import type { TreeNode } from "./tree";
import routes from "@/content/routes.json";

export type PageDoc = {
  route: string;
  title: string;
  description: string;
  ogImage: string | null;
  main: TreeNode;
  /** dialogs the original renders at the end of <body> (e.g. a project's "Deep Dive" article) */
  modal?: TreeNode;
};

export type Chrome = {
  header: TreeNode;
  cookieBanner: TreeNode;
  cookieDrawer: TreeNode;
  transition: TreeNode;
  footer: TreeNode;
  contact: TreeNode;
  scrollFacts: { distance: number; text: string; image: string | null; href: string | null }[];
};

const CONTENT = path.join(process.cwd(), "src/content");

export const allRoutes = routes as { slug: string; route: string; title: string }[];

export function slugForRoute(route: string) {
  return allRoutes.find((r) => r.route === route)?.slug ?? null;
}

export function loadPage(slug: string): PageDoc {
  return JSON.parse(fs.readFileSync(path.join(CONTENT, "pages", `${slug}.json`), "utf8"));
}

export function loadChrome(): Chrome {
  return JSON.parse(fs.readFileSync(path.join(CONTENT, "chrome.json"), "utf8"));
}
