import { FastifyRequest, FastifyReply, RouteHandlerMethod } from "fastify";
import { type BaseAppRequest } from "../types/common.base.types.requests";

// Controller Types
type BaseControllerHelper<
  T extends FastifyRequest,
  V extends BaseAppRequest<T>,
> = (
  request: V,
  reply: FastifyReply,
) => Promise<{
  request: V;
  reply: FastifyReply;
  data: unknown;
}>;

type BaseControllerBuilder = <
  T extends FastifyRequest,
  V extends BaseAppRequest<T>,
>(
  controllerHelper: BaseControllerHelper<T, V>,
) => RouteHandlerMethod;

// Controller Builder Implementation
const baseControllerBuilder: BaseControllerBuilder = <
  T extends FastifyRequest,
  V extends BaseAppRequest<T>,
>(
  controllerHelper: BaseControllerHelper<T, V>,
) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { data } = await controllerHelper(request as V, reply);
      return reply.status(201).send({ data });
    } catch (error) {
      throw error;
    }
  };
};

export {
  type BaseControllerHelper,
  type BaseControllerBuilder,
  baseControllerBuilder,
};
