import type { Portal } from "../models/enums";
import type { PortalAdapter } from "./portal-interface";
import { mevPortal } from "./portals/mev.portal";
import { saePortal } from "./portals/sae.portal";

// Central registry of all portal adapters.
// To add a new province/portal: create the adapter and register it here.
const adapters = new Map<Portal, PortalAdapter>([
  [mevPortal.portal, mevPortal],
  [saePortal.portal, saePortal],
]);

export function getPortalAdapter(portal: Portal): PortalAdapter {
  const adapter = adapters.get(portal);
  if (!adapter) {
    throw new Error(`No adapter registered for portal: ${portal}`);
  }
  return adapter;
}

export function getSupportedPortals(): Portal[] {
  return Array.from(adapters.keys());
}
