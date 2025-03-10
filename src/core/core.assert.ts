import { ErrorName } from "../common";
import getErrorConstructor from "../common/helpers/helpers.get-error-constructor";

function assert<T>(value: T, errorMessage: string, errorName: ErrorName) {
  if (value === null || value === undefined || value === false) {
    throw new (getErrorConstructor(errorName))(errorMessage);
  }

  return value as NonNullable<T>;
}

export { assert };
