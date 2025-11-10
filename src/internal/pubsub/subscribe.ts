import amqp, { type Channel } from "amqplib";
export enum SimpleQueueType {
  Durable,
  Transient,
}

type AckType = "Ack" | "NackRequeue" | "NackDiscard"

export async function declareAndBind(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType
): Promise<[Channel, amqp.Replies.AssertQueue]> {
  const ch = await conn.createChannel()

  const queue = await ch.assertQueue(queueName, {
    durable: queueType === SimpleQueueType.Durable,
    exclusive: queueType !== SimpleQueueType.Durable,
    autoDelete: queueType !== SimpleQueueType.Durable,
    arguments: {
      "x-dead-letter-exchange": "peril_dlx"
    }
  })
  await ch.bindQueue(queue.queue, exchange, key);
  return [ch, queue]
}

export async function subscribeJSON<T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
  handler: (data: T) => Promise<AckType> | AckType,
): Promise<void> {

  const [ch, queue] = await declareAndBind(
    conn,
    exchange,
    queueName,
    key,
    queueType,
  );

  await ch.consume(queue.queue, async function(msg: amqp.ConsumeMessage | null) {
    if (!msg) return;

    let data: T;
    try {
      data = JSON.parse(msg.content.toString());
    } catch (err) {
      console.error("Could not unmarshal message:", err);
      return;
    }

    const acktype = await handler(data);
    switch (acktype) {
      case "Ack":
        ch.ack(msg);
        break
      case "NackRequeue":
        ch.nack(msg, false, true);
        break
      case "NackDiscard":
        console.log("NackDiscard: sending to DLX");
        ch.nack(msg, false, false)
        break
    }
  });
}

