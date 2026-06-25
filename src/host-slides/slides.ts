import type {
  HostDeck,
  HostPresenterSlide,
} from "@/src/host-slides/types";
import {
  buildHostSlidesFromShowOrder,
  resolveHostShowOrder,
} from "@/src/host-slides/showOrder";

export function buildHostSlideSequence(deck: HostDeck): HostPresenterSlide[] {
  return buildHostSlidesFromShowOrder(deck, resolveHostShowOrder(deck));
}
