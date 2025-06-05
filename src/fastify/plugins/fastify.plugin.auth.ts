import { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { ErrorName } from "../../common";
import { assert } from "../../core/core.assert";
import cookie from "@fastify/cookie";
import { safe } from "../../core";

const enum AuthenticationMethod {
  cookieJwt = "cookieJwt",
  xApiKey = "xApiKey",
  emailPassword = "emailPassword",
}
interface OptionsForGetRequestByAuthMethodHelper {
  passwordEmailFieldNames?: {
    passwordFieldName: string;
    emailFieldName: string;
  };
  jwtCookieName?: string;
}
const authPlugin = fp(
  async <
    O extends OptionsForGetRequestByAuthMethodHelper,
    RequestUser extends { id: string } = { id: string },
  >(
    fastify: FastifyInstance,
    config: {
      getRequestUserByAuthMethodHelper: (
        authenticationMethod: AuthenticationMethod,
        authenticationMethodValue: string | Record<string, unknown>,
        options?: O,
      ) => Promise<RequestUser>;
      getUserByAuthMethodHelperOptions?: O;
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

          const jwtCookie =
            request.cookies[
              config.getUserByAuthMethodHelperOptions?.jwtCookieName ?? "jwt"
            ];
          if (jwtCookie) {
            return {
              authenticationMethod: AuthenticationMethod.cookieJwt,
              authenticationMethodValue: jwtCookie,
            };
          }

          if (
            (request.body as Record<string, unknown>)[
              config.getUserByAuthMethodHelperOptions?.passwordEmailFieldNames
                ?.emailFieldName ?? "email"
            ] &&
            (request.body as Record<string, unknown>)[
              config.getUserByAuthMethodHelperOptions?.passwordEmailFieldNames
                ?.passwordFieldName ?? "password"
            ]
          ) {
            return {
              authenticationMethod: AuthenticationMethod.emailPassword,
              authenticationMethodValue: {
                [config.getUserByAuthMethodHelperOptions
                  ?.passwordEmailFieldNames?.emailFieldName ?? "email"]: (
                  request.body as Record<string, unknown>
                )[
                  config.getUserByAuthMethodHelperOptions
                    ?.passwordEmailFieldNames?.emailFieldName ?? "email"
                ],
                [config.getUserByAuthMethodHelperOptions
                  ?.passwordEmailFieldNames?.passwordFieldName ?? "password"]: (
                  request.body as Record<string, unknown>
                )[
                  config.getUserByAuthMethodHelperOptions
                    ?.passwordEmailFieldNames?.passwordFieldName ?? "password"
                ],
              },
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
  },
);

export { AuthenticationMethod };
export { authPlugin };
