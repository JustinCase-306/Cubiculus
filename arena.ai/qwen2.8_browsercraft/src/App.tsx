import { useEffect, useState } from "react";
import GameView from "@/components/GameView";
import Landing from "@/components/Landing";

export default function App() {
  const [playing, setPlaying] = useState(false);

  // Spielfeld = Vollbild, Seitenscroll sperren
  useEffect(() => {
    document.body.style.overflow = playing ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [playing]);

  return playing ? <GameView onExit={() => setPlaying(false)} /> : <Landing onPlay={() => setPlaying(true)} />;
}
