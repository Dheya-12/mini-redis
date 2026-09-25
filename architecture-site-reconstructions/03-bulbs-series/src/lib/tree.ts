import { createElement, type ReactNode } from "react";

/**
 * Page markup is stored as compact JSON element trees (see tools/extract-content.mjs):
 *   node = string | [tag, props | 0, ...children]
 * Props are already React-shaped, so rendering is a straight createElement walk.
 */
export type TreeProps = Record<string, unknown>;
export type TreeElement = [string, TreeProps | 0, ...TreeNode[]];
export type TreeNode = string | TreeElement;

export function renderTree(node: TreeNode | null | undefined): ReactNode {
  if (node == null) return null;
  if (typeof node === "string") return node;
  const [tag, props, ...children] = node;
  const kids = children.map(renderTree);
  return createElement(tag, props || null, ...kids);
}

/** Depth-first search for the first element matching a predicate. */
export function findNode(node: TreeNode, test: (el: TreeElement) => boolean): TreeElement | null {
  if (typeof node === "string") return null;
  if (test(node)) return node;
  for (let i = 2; i < node.length; i++) {
    const hit = findNode(node[i] as TreeNode, test);
    if (hit) return hit;
  }
  return null;
}

export const hasClass = (el: TreeElement, cls: string) =>
  typeof el[1] === "object" && typeof el[1].className === "string" && el[1].className.split(" ").includes(cls);
