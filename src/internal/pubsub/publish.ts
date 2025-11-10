import { encode } from "@msgpack/msgpack";
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

export async function messagePack<T>(
  ch: ConfirmChannel,
  exchange: string,
  routingkey: string,
  value: T,
): Promise<void> {
  const msgPack = Buffer.from(encode(value))
  ch.publish(exchange, routingkey, msgPack, { contentType: "application/x-msgpack" })
}
