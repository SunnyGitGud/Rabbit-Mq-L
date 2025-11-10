import type { ConfirmChannel } from "amqplib";
import type { ArmyMove, RecognitionOfWar } from "../internal/gamelogic/gamedata.js";
import type {
  GameState,
  PlayingState,
} from "../internal/gamelogic/gamestate.js";
import { handleMove, MoveOutcome } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilTopic, WarRecognitionsPrefix } from "../internal/routing/routing.js";
import { handleWar, WarOutcome } from "../internal/gamelogic/war.js";

type AckType = "Ack" | "NackRequeue" | "NackDiscard"

export function handlerPause(gs: GameState): (ps: PlayingState) => Promise<AckType> {
  return async (ps: PlayingState): Promise<AckType> => {
    handlePause(gs, ps);
    process.stdout.write("> ");
    return "Ack"
  };
}

export function handlerMove(
  gs: GameState,
  ch: ConfirmChannel,
): (move: ArmyMove) => Promise<AckType> {
  return async (move: ArmyMove): Promise<AckType> => {
    try {
      const outcome = handleMove(gs, move);
      switch (outcome) {
        case MoveOutcome.Safe:
        case MoveOutcome.SamePlayer:
          return "Ack";
        case MoveOutcome.MakeWar:
          const recognition: RecognitionOfWar = {
            attacker: move.player,
            defender: gs.getPlayerSnap(),
          };

          try {
            await publishJSON(
              ch,
              ExchangePerilTopic,
              `${WarRecognitionsPrefix}.${gs.getUsername()}`,
              recognition,
            );
          } catch (err) {
            console.error("Error publishing war recognition:", err);
            return "NackRequeue";
          } finally {
            return "Ack"
          }
        default:
          return "NackDiscard";
      }
    } finally {
      process.stdout.write("> ");
    }
  };
}

export function handlerWar(
  gs: GameState,
): (war: RecognitionOfWar) => Promise<AckType> {
  return async (war: RecognitionOfWar): Promise<AckType> => {
    try {
      const outcome = handleWar(gs, war);

      switch (outcome.result) {
        case WarOutcome.NotInvolved:
          return "NackRequeue";
        case WarOutcome.NoUnits:
          return "NackDiscard";
        case WarOutcome.YouWon:
        case WarOutcome.OpponentWon:
        case WarOutcome.Draw:
          return "Ack";
        default:
          const unreachable: never = outcome;
          console.log("Unexpected war resolution: ", unreachable);
          return "NackDiscard";
      }
    } finally {
      process.stdout.write("> ");
    }
  };
}
