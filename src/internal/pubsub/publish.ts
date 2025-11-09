import type { ConfirmChannel } from "amqplib";

export async function publishJSON<T>(
  ch: ConfirmChannel,
  exchange: string,
  routingkey: string,
  value: T,
): Promise<void> {
  const jsonBytes = Buffer.from(JSON.stringify(value), "utf8")
  ch.publish(exchange, routingkey, jsonBytes, { contentType: "application/json" })
  await ch.waitForConfirms()
}
