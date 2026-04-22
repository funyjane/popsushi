import { FALLBACK_CHEFS } from "./fixtures";
import { KioskPlayer } from "./player";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "PopSushi · Demo",
};

export default function KioskPage() {
  return <KioskPlayer chefs={FALLBACK_CHEFS} />;
}
