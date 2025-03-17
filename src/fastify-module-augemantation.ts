declare module "fastify" {
  type RequestUser<I extends Record<any, any> = { id: string }> = I;

  interface FastifyRequest {
    _user?: RequestUser;
  }

  interface FastifyContextConfig {
    authenticate?: boolean;
  }
}

export {};
