import { dailyChallenge } from "@/lib/challenges";
import { Game } from "./game";

export const dynamic = "force-dynamic";
export default function Home() {
  return <Game challenge={dailyChallenge()} />;
}
