import type { ArmyMove } from "../internal/gamelogic/gamedata.js";
import type {
  GameState,
  PlayingState,
} from "../internal/gamelogic/gamestate.js";
import { handleMove, MoveOutcome } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";

type AckType = "Ack" | "NackRequeue" | "NackDiscard"

export function handlerPause(gs: GameState): (ps: PlayingState) => Promise<AckType> {
  return async (ps: PlayingState): Promise<AckType> => {
    handlePause(gs, ps);
    process.stdout.write("> ");
    return "Ack"
  };
}

export function handlerMove(gs: GameState): (as: ArmyMove) => Promise<AckType> {
  return async (as: ArmyMove): Promise<AckType> => {
    const move = handleMove(gs, as)
    if (move === MoveOutcome.Safe || move === MoveOutcome.MakeWar) {
      console.log(`Moved ${as.units.length} units to ${as.toLocation}`);
      process.stdout.write("> ")
      return "Ack"
    }
    if (move === MoveOutcome.SamePlayer) {
      console.log("Nack");
      process.stdout.write("> ")
      return "NackDiscard"
    }
    console.log(`unexpected move ${move} Nack`)
    return "NackDiscard"
  }
}

