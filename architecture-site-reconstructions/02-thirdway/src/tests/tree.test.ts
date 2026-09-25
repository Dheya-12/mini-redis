import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { renderTree, findNode, hasClass, type TreeNode } from "../lib/tree.ts";

test("renders element trees with React-shaped props", () => {
  const tree: TreeNode = ["section", { className: "a b", "data-x": "1" },
    ["h2", { style: { "--fluid-size": "84", marginTop: "2px" } }, "Hello", ["br", 0], "world"],
    ["img", { src: "/media/x.avif", alt: "", loading: "lazy" }],
  ];
  assert.equal(
    renderToStaticMarkup(renderTree(tree)),
    '<section class="a b" data-x="1"><h2 style="--fluid-size:84;margin-top:2px">Hello<br/>world</h2><img src="/media/x.avif" alt="" loading="lazy"/></section>',
  );
});

test("finds nodes by class", () => {
  const tree: TreeNode = ["div", 0, ["span", { className: "x project-card" }, "a"], ["p", 0, "b"]];
  const hit = findNode(tree, (el) => hasClass(el, "project-card"));
  assert.ok(hit);
  assert.equal(hit![0], "span");
  assert.equal(findNode(tree, (el) => hasClass(el, "nope")), null);
});
