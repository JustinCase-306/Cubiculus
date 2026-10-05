export interface ControlRow {
  keys: string[];
  label: string;
  hint?: string;
}

export const CONTROLS: ControlRow[] = [
  { keys: ["W", "A", "S", "D"], label: "Bewegen", hint: "laufen, springen, schwimmen" },
  { keys: ["MAUS"], label: "Umsehen", hint: "Zeiger wird gefangen" },
  { keys: ["LINKS"], label: "Block abbauen", hint: "Halten = im Akkord" },
  { keys: ["RECHTS"], label: "Block setzen", hint: "auf die Zielfläche" },
  { keys: ["LEER"], label: "Springen / Schwimmen", hint: "im Flugmodus: aufsteigen" },
  { keys: ["SHIFT"], label: "Sprinten", hint: "im Flugmodus: sinken" },
  { keys: ["F"], label: "Flugmodus", hint: "Kreativmodus an/aus" },
  { keys: ["E"], label: "Inventar", hint: "Block in den Slot legen" },
  { keys: ["1", "9"], label: "Slot wählen", hint: "oder Mausrad" },
  { keys: ["R"], label: "Respawn", hint: "zurück zum Startpunkt" },
  { keys: ["ESC"], label: "Pause", hint: "Zeiger freigeben" },
];
