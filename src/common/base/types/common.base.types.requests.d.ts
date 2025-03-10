import { FastifyRequest } from "fastify"

type BaseAppRequest<T extends FastifyRequest> = T & {
    body: T["body"]
    parmas: T["params"]
}

export { BaseAppRequest }
