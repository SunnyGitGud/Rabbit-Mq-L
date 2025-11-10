import { writeLog } from "../internal/gamelogic/logs.js";

export interface GameLog {
  currentTime: Date;
  message: string;
  username: string;
}
export type AckType = "Ack" | "NackRequeue" | "NackDiscard"
export function handlerLog() {
  return async (gamelog: GameLog): Promise<AckType> => {
    try {
      writeLog(gamelog);
      return "Ack"
    } catch (err) {
      console.error("Error writing Log:", err)
      return "NackDiscard"
    } finally {
      process.stdout.write("< ")
    }
  }
}
