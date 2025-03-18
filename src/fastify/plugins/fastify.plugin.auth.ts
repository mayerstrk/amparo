import { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { ErrorName } from "../../common";
import { assert } from "../../core/core.assert";
import cookie from "@fastify/cookie";

const enum AuthenticationMethod {
  cookieJwt = "cookieJwt",
  xApiKey = "xApiKey",
}

const authPlugin = fp(
  async <
    OptionsForGetRequestByAuthMethodHelper extends Record<string, unknown>,
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
  ) => {
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
          if (request.cookies["jwt"]) {
            return {
              authenticationMethod: AuthenticationMethod.cookieJwt,
              authenticationMethodValue: request.cookies["jwt"],
            };
          }
        })(),
        "No authentication method found",
        ErrorName.authentication,
      );

      const requestUser = await config.getRequestUserByAuthMethodHelper(
        authenticationMethod,
        authenticationMethodValue,
        config.getUserByAuthMethodHelperOptions,
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
  },
);

export { AuthenticationMethod };
export { authPlugin };
