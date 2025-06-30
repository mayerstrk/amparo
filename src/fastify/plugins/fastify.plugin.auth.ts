import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { ErrorName } from "../../common";
import { assert } from "../../core/core.assert";
import cookie from "@fastify/cookie";
import { safe } from "../../core";

// === Type Definitions ===

const enum AuthenticationMethod {
  cookieJwt = "cookieJwt",
  bearer = "bearer",
  xApiKey = "xApiKey",
}

type RequestUser = { id: string };

// We define the different shapes our config object can take.

// 1. Base config shape, always present.
type BaseConfig<OFH, RU extends RequestUser> = {
  getRequestUserByAuthMethodHelper: (
    authenticationMethod: AuthenticationMethod,
    authenticationMethodValue: string,
    options: OFH,
  ) => Promise<RU>;
};

// 2. Config when NEITHER option generic is provided.
// `property?: never` is a trick to forbid a property.
type ConfigWithNoOptions<RU extends RequestUser> = BaseConfig<undefined, RU> & {
  options?: never;
  getUserByAuthMethodHelperOptions?: never;
};

// 3. Config when ONLY top-level `options` is provided.
type ConfigWithOptions<O, RU extends RequestUser> = BaseConfig<
  undefined,
  RU
> & {
  options: O;
  getUserByAuthMethodHelperOptions?: never;
};

// 4. Config when ONLY the helper's `options` is provided.
type ConfigWithHelperOptions<OFH, RU extends RequestUser> = BaseConfig<
  OFH,
  RU
> & {
  options?: never;
  getUserByAuthMethodHelperOptions: OFH;
};

// 5. Config when BOTH options are provided.
type ConfigWithBothOptions<O, OFH, RU extends RequestUser> = BaseConfig<
  OFH,
  RU
> & {
  options: O;
  getUserByAuthMethodHelperOptions: OFH;
};

// === Overloaded Function Declaration ===

// Overload for neither options
function authPluginFn<RU extends RequestUser>(
  fastify: FastifyInstance,
  config: ConfigWithNoOptions<RU>,
): Promise<void>;

// Overload for only `options`
function authPluginFn<
  O extends { jwtCookieName?: string },
  RU extends RequestUser,
>(fastify: FastifyInstance, config: ConfigWithOptions<O, RU>): Promise<void>;

// Overload for only `getUserByAuthMethodHelperOptions`
function authPluginFn<OFH extends Record<string, any>, RU extends RequestUser>(
  fastify: FastifyInstance,
  config: ConfigWithHelperOptions<OFH, RU>,
): Promise<void>;

// Overload for BOTH options
function authPluginFn<
  O extends { jwtCookieName?: string },
  OFH extends Record<string, any>,
  RU extends RequestUser,
>(
  fastify: FastifyInstance,
  config: ConfigWithBothOptions<O, OFH, RU>,
): Promise<void>;

// === Single Implementation ===
async function authPluginFn(
  fastify: FastifyInstance,
  config:
    | ConfigWithNoOptions<any>
    | ConfigWithOptions<any, any>
    | ConfigWithHelperOptions<any, any>
    | ConfigWithBothOptions<any, any, any>,
): Promise<void> {
  // Your existing plugin logic goes here, unchanged.
  fastify.decorateRequest("_user", null);
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

        const jwtCookieName =
          "options" in config && config.options?.jwtCookieName
            ? config.options.jwtCookieName
            : "jwt";
        const jwtCookie = request.cookies[jwtCookieName];

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

    (request as any)._user = requestUser;
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
}

// Finally, we wrap our overloaded function with fastify-plugin.
const authPlugin = fp(authPluginFn as FastifyPluginAsync<any>);

export { AuthenticationMethod, authPlugin };
