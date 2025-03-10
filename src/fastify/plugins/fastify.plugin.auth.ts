import { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { ErrorName } from "../../common"; // Adjust path as needed
import { assert } from "../../core/core.assert"; // Adjust path as needed
import cookie from "@fastify/cookie";

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

interface AuthOptions<U extends CompatibleUserShapes> {
  jwtSecret: string;
  getUserByAuthMethodHelper: (
    authenticationMethod: AuthenticationMethod,
    authenticationMethodValue: string,
  ) => Promise<U[]>;
}

enum AuthenticationMethod {
  cookieJwt = "cookieJwt",
  xApiKey = "xApiKey",
}

const authPlugin = fp(
  async <U extends CompatibleUserShapes>(
    fastify: FastifyInstance,
    options: AuthOptions<U>,
  ) => {
    // Register cookie plugin
    await fastify.register(cookie);

    // Authentication logic
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

      const successfulDbUserResponse = await options.getUserByAuthMethodHelper(
        authenticationMethod,
        authenticationMethodValue,
      );

      if (successfulDbUserResponse.length > 0) {
        request._user = { id: successfulDbUserResponse[0].id }; // Relies on augmentation
      } else {
        throw new Error("User not found");
      }
    };

    // Add authentication to routes with config.authenticate
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
  {
    name: "auth-plugin",
    fastify: "4.x", // Match your Fastify version
  },
);

export default fp(authPlugin);
