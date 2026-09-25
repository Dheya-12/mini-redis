import type { TreeNode } from "./tree";

const SVG_NS = "http://www.w3.org/2000/svg";
const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
const KEEP_CAMEL = new Set(["viewBox", "preserveAspectRatio", "gradientUnits", "gradientTransform", "patternUnits", "clipPathUnits"]);

/** Build real DOM nodes from a content tree (used for markup swapped in at runtime, e.g. team logos). */
export function toDom(node: TreeNode, svg = false): Node {
  if (typeof node === "string") return document.createTextNode(node);
  const [tag, props, ...kids] = node;
  const isSvg = svg || tag === "svg";
  const el = isSvg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === "className") el.setAttribute("class", String(v));
    else if (k === "style") Object.assign((el as HTMLElement).style, v as object);
    else el.setAttribute(isSvg && !KEEP_CAMEL.has(k) && !k.startsWith("data-") ? kebab(k) : k, String(v));
  }
  kids.forEach((k) => el.appendChild(toDom(k, isSvg)));
  return el;
}
