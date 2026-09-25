import fs from "node:fs";
import path from "node:path";
import type { TreeNode } from "./tree";
import routes from "@/content/routes.json";

export type PageDoc = {
  route: string;
  title: string;
  description: string;
  ogImage: string | null;
  /** whether the original plays its intro preloader on this route */
  intro: boolean;
  /** the page container (header, content and modals), rendered straight into <body> */
  view: TreeNode;
};

export type Chrome = {
  skip: TreeNode;
  preloader: TreeNode;
  preloaderIntro: TreeNode;
  cookie: TreeNode;
  turn: TreeNode;
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
