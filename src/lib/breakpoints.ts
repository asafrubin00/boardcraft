/**
 * The single layout breakpoint, mirrored from the `md` custom variant in
 * globals.css — keep the two in lockstep.
 *
 * Below it the app renders the touch-first single-column layout (phones and
 * portrait tablets); at or above it, the multi-panel desktop layout (laptops
 * and landscape tablets). Any JS that branches on layout mode must call this
 * rather than compare against a literal, so it can never drift from the CSS.
 */
export const MD_QUERY = '(min-width: 64rem) and (orientation: landscape)';

/** True when the viewport is using the desktop (multi-panel) layout. */
export function isDesktopViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(MD_QUERY).matches;
}

/**
 * True on a touch-layout viewport with room for the boardroom table and the
 * event card at once — i.e. a portrait tablet, not a phone.
 *
 * Width is the honest discriminator here, not height: the narrowest iPad in
 * portrait is 744px and the widest phone is ~440px, whereas phone and tablet
 * *heights* overlap (iPhone 16 Pro Max is 956px tall). Keying off height would
 * hand large phones the tablet behaviour, and the collapsing board is
 * deliberate on phones.
 */
export function hasRoomForBoardAndEvent(): boolean {
  return (
    typeof window !== 'undefined' &&
    !isDesktopViewport() &&
    window.matchMedia('(min-width: 700px)').matches
  );
}
