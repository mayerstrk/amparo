type RequestUser<
  I extends Record<any, any> = { id: string },
  O extends Record<any, any> = {},
> = I & O;

declare module "fastify" {
  interface FastifyRequest {
    _user?: RequestUser;
  }

  interface FastifyContextConfig {
    authenticate?: boolean;
  }
}

export { RequestUser };
