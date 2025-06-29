import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { EventEmitter } from "events";

const createEventBus = <KnownEvents extends Record<string, unknown>>() => {
  const emitter = new EventEmitter();

  return {
    emit: <K extends keyof KnownEvents & string>(
      event: K,
      payload: KnownEvents[K],
    ): void => {
      emitter.emit(event, payload);
    },

    on: <K extends keyof KnownEvents & string>(
      event: K,
      listener: (payload: KnownEvents[K]) => void,
    ): void => {
      emitter.on(event, listener);
    },
  };
};

async function eventBusPluginHelper(fastify: FastifyInstance) {
  const eventBus = createEventBus();
  fastify.decorate("eventBus", eventBus);
}

export type AppEventBus = ReturnType<typeof createEventBus>;
export const eventBusPlugin = fp(eventBusPluginHelper);
