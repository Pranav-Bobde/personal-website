import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { demoRegistry } from "./registry";

/*
 * Blog posts drop `::demo[name]` directives, which the markdown renderer turns
 * into `<div class="blog-demo" data-demo="name">` mount points inside the
 * dangerouslySetInnerHTML article. After hydration this scans the rendered
 * article for those mounts and portals the matching interactive widget into
 * each — so posts stay plain markdown while embedding real React demos.
 */
export function BlogDemoPortals({
  containerRef,
  contentKey,
}: {
  containerRef: RefObject<HTMLElement | null>;
  contentKey: string;
}) {
  const [mounts, setMounts] = useState<{ name: string; node: HTMLElement }[]>([]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) {
      setMounts([]);
      return;
    }

    const scanMounts = () => {
      const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-demo]"));
      setMounts(
        nodes
          .map((node) => ({ name: node.dataset.demo ?? "", node }))
          .filter((mount) => mount.name in demoRegistry),
      );
    };

    scanMounts();

    const containsDemoMount = (node: Node) =>
      node instanceof Element &&
      (node.matches("[data-demo]") || Boolean(node.querySelector("[data-demo]")));
    const observer = new MutationObserver((records) => {
      const demoMountChanged = records.some((record) =>
        [...record.addedNodes, ...record.removedNodes].some(containsDemoMount),
      );
      if (demoMountChanged) scanMounts();
    });
    observer.observe(root, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [containerRef, contentKey]);

  return (
    <>
      {mounts.map(({ name, node }) => {
        const Demo = demoRegistry[name];
        return createPortal(<Demo key={name} />, node);
      })}
    </>
  );
}
