import fastify, { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { ErrorName } from "../../common";
import { assert } from "../../core/core.assert";
import cookie from "@fastify/cookie";
import { safe } from "../../core";

const enum AuthenticationMethod {
  cookieJwt = "cookieJwt",
  bearer = "bearer",
  xApiKey = "xApiKey",
}

type NotEmpty<T> = keyof T extends never ? never : T;

async function authPluginFn<
  RequestUser extends { id: string } = { id: string },
>(
  fastify: FastifyInstance,
  config: {
    getRequestUserByAuthMethodHelper: (
      authenticationMethod: AuthenticationMethod,
      authenticationMethodValue: string,
    ) => Promise<RequestUser>;
  },
): Promise<void>;

async function authPluginFn<
  Options extends NotEmpty<
    Record<string, unknown> & { jwtCookieName?: string }
  >,
  RequestUser extends { id: string } = { id: string },
>(
  fastify: FastifyInstance,
  config: {
    options: Options;
    getRequestUserByAuthMethodHelper: (
      authenticationMethod: AuthenticationMethod,
      authenticationMethodValue: string,
    ) => Promise<RequestUser>;
  },
): Promise<void>;

async function authPluginFn<
  OptionsForGetRequestByAuthMethodHelper extends NotEmpty<
    Record<string, unknown>
  >,
  RequestUser extends { id: string } = { id: string },
>(
  fastify: FastifyInstance,
  config: {
    getRequestUserByAuthMethodHelper: (
      authenticationMethod: AuthenticationMethod,
      authenticationMethodValue: string,
      options?: OptionsForGetRequestByAuthMethodHelper,
    ) => Promise<RequestUser>;
    getUserByAuthMethodHelperOptions?: OptionsForGetRequestByAuthMethodHelper;
  },
): Promise<void>;

async function authPluginFn<
  Options extends NotEmpty<
    Record<string, unknown> & { jwtCookieName?: string }
  >,
  OptionsForGetRequestByAuthMethodHelper extends NotEmpty<
    Record<string, unknown>
  >,
  RequestUser extends { id: string } = { id: string },
>(
  fastify: FastifyInstance,
  config: {
    options?: Options;
    getRequestUserByAuthMethodHelper: (
      authenticationMethod: AuthenticationMethod,
      authenticationMethodValue: string,
      options?: OptionsForGetRequestByAuthMethodHelper,
    ) => Promise<RequestUser>;
    getUserByAuthMethodHelperOptions?: OptionsForGetRequestByAuthMethodHelper;
  },
): Promise<void>;

async function authPluginFn<
  Options extends
    | NotEmpty<Record<string, unknown> & { jwtCookieName?: string }>
    | never,
  OptionsForGetRequestByAuthMethodHelper extends
    | NotEmpty<Record<string, unknown>>
    | never,
  RequestUser extends { id: string } = { id: string },
>(
  fastify: FastifyInstance,
  config: {
    options?: Options;
    getRequestUserByAuthMethodHelper: (
      authenticationMethod: AuthenticationMethod,
      authenticationMethodValue: string,
      options?: OptionsForGetRequestByAuthMethodHelper,
    ) => Promise<RequestUser>;
    getUserByAuthMethodHelperOptions?: OptionsForGetRequestByAuthMethodHelper;
  },
) {
  fastify.decorateRequest("_user");
  fastify.register(cookie);
  const authenticate = async (request: FastifyRequest) => {
    const { authenticationMethod, authenticationMethodValue } = assert(
      (() => {
        const apiKey = Array.isArray(request.headers["x-api-key"])
          ? request.headers["x-api-key"][0]
          : request.headers["x-api-key"];
        if (apiKey) {
          return {
            authenticationMethod: AuthenticationMethod.xApiKey,
            authenticationMethodValue: apiKey,
          };
        }

        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const bearerToken = authHeader.substring(7);
          return {
            authenticationMethod: AuthenticationMethod.bearer,
            authenticationMethodValue: bearerToken,
          };
        }

        const jwtCookie =
          request.cookies[config.options?.jwtCookieName ?? "jwt"];
        if (jwtCookie) {
          return {
            authenticationMethod: AuthenticationMethod.cookieJwt,
            authenticationMethodValue: jwtCookie,
          };
        }
      })(),
      "No authentication method found",
      ErrorName.authentication,
    );

    const requestUser = await safe(
      config.getRequestUserByAuthMethodHelper(
        authenticationMethod,
        authenticationMethodValue,
        config.getUserByAuthMethodHelperOptions,
      ),
      "Falid to get user by auth method",
      ErrorName.authentication,
    );

    request._user = requestUser;
  };

  fastify.addHook("onRoute", (routeOptions) => {
    if (routeOptions.config?.authenticate) {
      const preHandler = routeOptions.preHandler;
      if (Array.isArray(preHandler)) {
        routeOptions.preHandler = [authenticate, ...preHandler];
      } else if (preHandler) {
        routeOptions.preHandler = [authenticate, preHandler];
      } else {
        routeOptions.preHandler = authenticate;
      }
    }
  });
  console.log("Hi");
}

export { AuthenticationMethod };
export const authPlugin = fp(authPluginFn);
