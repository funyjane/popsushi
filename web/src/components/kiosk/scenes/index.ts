import type { SceneDefinition } from "../types";
import { SceneBookingForm } from "./scene-booking-form";
import { SceneChefAccept } from "./scene-chef-accept";
import { SceneChefDetail } from "./scene-chef-detail";
import { SceneChefInbox } from "./scene-chef-inbox";
import { SceneCustomerConfirm } from "./scene-customer-confirm";
import { SceneLanding } from "./scene-landing";
import { SceneLoopCard } from "./scene-loop-card";
import { SceneReview } from "./scene-review";
import { SceneSearch } from "./scene-search";

// Cursor coords are percentages of the fullscreen viewport. The scenes are
// centered content inside that viewport — coords were tuned against a 1440×900
// viewport but stay visually fine at 1080p/4K because the underlying scene
// layout uses the same max-width containers at each resolution.
export const KIOSK_SCENES: SceneDefinition[] = [
  {
    id: "landing",
    durationMs: 5000,
    caption: "Customers book private sushi chefs — for home dinners, events, anywhere.",
    Component: SceneLanding,
    cursorScript: [
      { at: 0, xPct: 20, yPct: 20 },
      { at: 2500, xPct: 50, yPct: 78, action: "click" },
    ],
  },
  {
    id: "search",
    durationMs: 12000,
    caption: "Drop a pin where your event is. Chefs whose radius covers it show up.",
    Component: SceneSearch,
    cursorScript: [
      { at: 0, xPct: 48, yPct: 65 },
      { at: 1500, xPct: 50, yPct: 58, action: "click" },
      { at: 6000, xPct: 62, yPct: 80 },
      { at: 10500, xPct: 88, yPct: 80, action: "click" },
    ],
  },
  {
    id: "chef-detail",
    durationMs: 10000,
    caption: "Menu, reviews, pricing — everything before you commit.",
    Component: SceneChefDetail,
    cursorScript: [
      { at: 0, xPct: 70, yPct: 40 },
      { at: 2500, xPct: 50, yPct: 55 },
      { at: 6500, xPct: 28, yPct: 70, action: "click" },
    ],
  },
  {
    id: "booking-form",
    durationMs: 12000,
    caption: "Date, guests, address. Total locks at request.",
    Component: SceneBookingForm,
    cursorScript: [
      { at: 0, xPct: 60, yPct: 40 },
      { at: 1200, xPct: 60, yPct: 45 },
      { at: 5000, xPct: 22, yPct: 42 },
      { at: 6800, xPct: 22, yPct: 42 },
      { at: 10500, xPct: 25, yPct: 85, action: "click" },
    ],
  },
  {
    id: "chef-inbox",
    durationMs: 8000,
    caption: "Chefs see every incoming request in one inbox.",
    Component: SceneChefInbox,
    cursorScript: [
      { at: 0, xPct: 50, yPct: 50 },
      { at: 4500, xPct: 50, yPct: 45 },
      { at: 6500, xPct: 50, yPct: 48, action: "click" },
    ],
  },
  {
    id: "chef-accept",
    durationMs: 8000,
    caption: "One tap to accept. Customer gets notified instantly.",
    Component: SceneChefAccept,
    cursorScript: [
      { at: 0, xPct: 60, yPct: 35 },
      { at: 2000, xPct: 40, yPct: 55 },
      { at: 4000, xPct: 22, yPct: 82, action: "click" },
    ],
  },
  {
    id: "customer-confirm",
    durationMs: 8000,
    caption: "Confirmed. The chef is on their way in three days.",
    Component: SceneCustomerConfirm,
    cursorScript: [
      { at: 0, xPct: 60, yPct: 20 },
      { at: 2500, xPct: 40, yPct: 40 },
      { at: 5000, xPct: 60, yPct: 60 },
    ],
  },
  {
    id: "review",
    durationMs: 7000,
    caption: "After service, leave a review. Chefs live and die by these.",
    Component: SceneReview,
    cursorScript: [
      { at: 0, xPct: 50, yPct: 50 },
      { at: 2400, xPct: 36, yPct: 48, action: "click" },
      { at: 3000, xPct: 39, yPct: 48, action: "click" },
      { at: 3600, xPct: 42, yPct: 48, action: "click" },
      { at: 4200, xPct: 45, yPct: 48, action: "click" },
      { at: 4800, xPct: 48, yPct: 48, action: "click" },
      { at: 5500, xPct: 30, yPct: 82, action: "click" },
    ],
  },
  {
    id: "loop",
    durationMs: 4500,
    caption: "",
    Component: SceneLoopCard,
    cursorScript: [{ at: 0, xPct: -10, yPct: -10 }],
  },
];
