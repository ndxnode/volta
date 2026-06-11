// Functional stub. U8 will implement the full command palette here.
//
// Contract (already wired by U2):
//   - SiteHeader's search button dispatches a CustomEvent named 'volta:open-command'
//     on window. This component should add a window event listener for it.
//   - It should ALSO open on the ⌘K / Ctrl+K keyboard shortcut.
//   - Built on @/components/ui/command (cmdk). Provides search across cars,
//     and quick-nav to /cars, /compare, /stats, /favorites.
//
// TODO(U8): replace this stub with the real CommandPalette implementation.
export function CommandPalette() {
  return null
}
