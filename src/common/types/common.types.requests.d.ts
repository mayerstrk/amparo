import { FastifyRequest } from "fastify"

interface RequestUser {
    id: string
}

interface EmptyRequest extends FastifyRequest {
    body: never
    params: never
    query: never
    user?: never
}

export { RequestUser, EmptyRequest }
