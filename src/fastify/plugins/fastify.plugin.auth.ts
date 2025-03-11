import { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { ErrorName } from "../../common";
import { assert } from "../../core/core.assert";
import cookie from "@fastify/cookie";

// TODO: Add other options e.g. _id uuid _uuid
type CompatibleUserShapes = { id: string };

interface RequestUser {
  id: string;
}

declare module "fastify" {
  interface FastifyRequest {
    _user?: RequestUser;
  }

  interface FastifyContextConfig {
    authenticate?: boolean;
  }
}

const enum AuthenticationMethod {
  cookieJwt = "cookieJwt",
  xApiKey = "xApiKey",
}

type GetUserByAuthMethodHelperRequiredOptions = {
  authenticationMethod: AuthenticationMethod;
  authenticationMethodValue: string;
};

interface AuthConfig<
  O extends Record<string, string>,
  U extends CompatibleUserShapes = CompatibleUserShapes,
> {
  getUserByAuthMethodHelper: (
    requiredOptions: GetUserByAuthMethodHelperRequiredOptions,
    addtionalOptions: O,
  ) => Promise<U[]>;
  getUserByAythMethodHelperAdditionalOptions: O;
}

const authPlugin = fp(
  async <
    U extends CompatibleUserShapes,
    O extends GetUserByAuthMethodHelperRequiredOptions,
  >(
    fastify: FastifyInstance,
    config: AuthConfig<O, U>,
  ) => {
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
          throw new Error("No authentication method found");
        })(),
        "No authentication method found",
        ErrorName.internalServerError,
      );

      const successfulDbUserResponse = await config.getUserByAuthMethodHelper(
        { authenticationMethod, authenticationMethodValue },
        config.getUserByAythMethodHelperAdditionalOptions,
      );

      request._user = { id: successfulDbUserResponse[0].id };
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
