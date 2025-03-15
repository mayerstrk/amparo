interface RequestUser {
  id: string;
  [key: string]: unknown;
}

declare module "fastify" {
  interface FastifyRequest {
    _user?: RequestUser;
  }

  interface FastifyContextConfig {
    authenticate?: boolean;
  }
}
