/**
 * Faint topographic lines behind the public pages, above the glass scene.
 * Fixed like the scene, so the glass panels frost the lines as they scroll
 * past. Hidden on paper.
 */
export function ContourScene() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 contour-scene print:hidden"
    />
  );
}
