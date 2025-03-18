declare module "fastify" {
  interface FastifyRequest {
    _user?: unknown;
  }

  interface FastifyContextConfig {
    authenticate?: boolean;
  }
}
export {};
