import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { ErrorName } from "../../common";
import { assert } from "../../core/core.assert";
import cookie from "@fastify/cookie";
import { safe } from "../../core";

// --- Type Definitions ---

const enum AuthenticationMethod {
  cookieJwt = "cookieJwt",
  bearer = "bearer",
  xApiKey = "xApiKey",
}

type RequestUser = { id: string };

/**
 * A utility type that evaluates to `never` if T is an empty object `{}`,
 * otherwise evaluates to T. This is used to constrain our generics.
 */
type NotEmpty<T> = keyof T extends never ? never : T;

/**
 * The base configuration shape that is always required by the plugin.
 */
type BaseConfig<
  OptionsForGetRequestByAuthMethodHelper,
  RU extends RequestUser,
> = {
  getRequestUserByAuthMethodHelper: (
    authenticationMethod: AuthenticationMethod,
    authenticationMethodValue: string,
    options: OptionsForGetRequestByAuthMethodHelper,
  ) => Promise<RU>;
};

// --- Overloaded Function Declaration ---
// Here we explicitly define the 4 valid signatures for our plugin.

// Overload 1: For when NEITHER `options` key is provided.
function authPluginFn<RU extends RequestUser>(
  fastify: FastifyInstance,
  config: BaseConfig<undefined, RU> & {
    options?: never; // `never` forbids this key from being passed.
    getUserByAuthMethodHelperOptions?: never;
  },
): Promise<void>;

// Overload 2: For when ONLY the top-level `options` is provided.
function authPluginFn<
  Options extends NotEmpty<
    Record<string, unknown> & { jwtCookieName?: string }
  >,
  RU extends RequestUser,
>(
  fastify: FastifyInstance,
  config: BaseConfig<undefined, RU> & {
    options: Options;
    getUserByAuthMethodHelperOptions?: never;
  },
): Promise<void>;

// Overload 3: For when ONLY `getUserByAuthMethodHelperOptions` is provided.
function authPluginFn<
  OptionsForGetRequestByAuthMethodHelper extends NotEmpty<
    Record<string, unknown>
  >,
  RU extends RequestUser,
>(
  fastify: FastifyInstance,
  config: BaseConfig<OptionsForGetRequestByAuthMethodHelper, RU> & {
    options?: never;
    getUserByAuthMethodHelperOptions: OptionsForGetRequestByAuthMethodHelper;
  },
): Promise<void>;

// Overload 4: For when BOTH `options` keys are provided.
function authPluginFn<
  Options extends NotEmpty<
    Record<string, unknown> & { jwtCookieName?: string }
  >,
  OptionsForGetRequestByAuthMethodHelper extends NotEmpty<
    Record<string, unknown>
  >,
  RU extends RequestUser,
>(
  fastify: FastifyInstance,
  config: BaseConfig<OptionsForGetRequestByAuthMethodHelper, RU> & {
    options: Options;
    getUserByAuthMethodHelperOptions: OptionsForGetRequestByAuthMethodHelper;
  },
): Promise<void>;

// --- Single Implementation ---
// The actual function body, compatible with all overloads.
async function authPluginFn(
  fastify: FastifyInstance,
  config: {
    getRequestUserByAuthMethodHelper: (
      authenticationMethod: AuthenticationMethod,
      authenticationMethodValue: string,
      options: unknown,
    ) => Promise<RequestUser>;
    options?: { jwtCookieName?: string };
    getUserByAuthMethodHelperOptions?: unknown;
  },
): Promise<void> {
  // Your plugin logic, now fully type-safe.
  fastify.decorateRequest("_user", null);
  fastify.register(cookie);

  const authenticate = async (request: FastifyRequest) => {
    const { authenticationMethod, authenticationMethodValue } = assert(
      (() => {
        const apiKey = Array.isArray(request.headers["x-api-key"])
          ? request.headers["x-api-key"][0]
          : request.headers["x-api-key"];
        if (apiKey)
          return {
            authenticationMethod: AuthenticationMethod.xApiKey,
            authenticationMethodValue: apiKey,
          };

        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith("Bearer "))
          return {
            authenticationMethod: AuthenticationMethod.bearer,
            authenticationMethodValue: authHeader.substring(7),
          };

        // Safely access options using the `in` type guard to satisfy TypeScript
        const jwtCookieName =
          "options" in config && config.options?.jwtCookieName
            ? config.options.jwtCookieName
            : "jwt";
        const jwtCookie = request.cookies[jwtCookieName];
        if (jwtCookie)
          return {
            authenticationMethod: AuthenticationMethod.cookieJwt,
            authenticationMethodValue: jwtCookie,
          };
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
      "Failed to get user by auth method",
      ErrorName.authentication,
    );

    // Using a type assertion on the request object, avoiding module augmentation
    (request as FastifyRequest & { _user: RequestUser })._user = requestUser;
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

// A type assertion is still necessary here to reconcile the multiple, complex
// overload signatures with the generic FastifyPluginAsync type that `fp` expects.
const authPlugin = fp(
  authPluginFn as FastifyPluginAsync<Record<string, unknown>>,
);

export { AuthenticationMethod, authPlugin };
