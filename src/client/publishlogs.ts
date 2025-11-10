import { messagePack } from "../internal/pubsub/publish.js";
import { ExchangePerilTopic, GameLogSlug } from "../internal/routing/routing.js";
import amqp from "amqplib";

export interface GameLog {
  currentTime: Date;
  message: string;
  username: string;
}
export async function publishGameLogs(
  ch: amqp.ConfirmChannel,
  username: string,
  message: string
): Promise<void> {
  const log: GameLog = {
    username,
    message,
    currentTime: new Date()
  }

  const routingkey = `${GameLogSlug}.${username}`
  await messagePack(ch, ExchangePerilTopic, routingkey, log)
}
