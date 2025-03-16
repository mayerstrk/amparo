declare module "fastify" {
  type RequestUser<
    I extends Record<any, any> = { id: string },
    O extends Record<any, any> = {},
  > = I & O;

  interface FastifyRequest {
    _user?: RequestUser;
  }

  interface FastifyContextConfig {
    authenticate?: boolean;
  }
}

export {};
