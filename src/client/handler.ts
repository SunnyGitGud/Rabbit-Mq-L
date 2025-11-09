import type { ArmyMove } from "../internal/gamelogic/gamedata.js";
import type {
  GameState,
  PlayingState,
} from "../internal/gamelogic/gamestate.js";
import { handleMove } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";

export function handlerPause(gs: GameState): (ps: PlayingState) => void {
  return (ps: PlayingState) => {
    handlePause(gs, ps);
    process.stdout.write("> ");
  };
}

export function handlerMove(gs: GameState): (as: ArmyMove) => void {
  return (as: ArmyMove) => {
    handleMove(gs, as)
    console.log(`Moved ${as.units.length} units to ${as.toLocation}`);
    process.stdout.write("> ")
  }
}

