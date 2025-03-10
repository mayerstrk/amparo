import { ErrorName } from "../common";
import getErrorConstructor from "../common/helpers/helpers.get-error-constructor";

/**
 * Function overloads for `safe`.
 *
 * 1. Ensures that the provided asynchronous value (Promise) resolves successfully.
 *    If the Promise is rejected, it calls the provided error handler function.
 * 2. Ensures that the provided asynchronous value (Promise) resolves successfully.
 *    Throws a custom error with a specified message and name if the Promise is rejected.
 *
 * @template T The type of the value that the Promise resolves to.
 *
 * @overload
 * @param {Promise<T>} value The promise whose resolution is to be checked.
 * @param {(error: any) => void} errorHandler Function to handle the error if the promise rejects.
 * @returns {Promise<T>} A promise resolving to the value if successful.
 *
 * @overload
 * @param {Promise<T>} value The promise whose resolution is to be checked.
 * @param {string} errorMessage The error message to use if the promise rejects.
 * @param {ErrorName} errorName The name of the error to be thrown if the promise rejects.
 * @returns {Promise<T>} A promise resolving to the value if successful.
 * @throws {Error} Throws an error of the specified `ErrorName` with the provided `errorMessage` if the promise rejects.
 */
function safe<T>(
  value: Promise<T>,
  errorHandler: (error: any) => [errorMessage: string, errorName: ErrorName],
): Promise<T>;

function safe<T>(
  value: Promise<T>,
  errorMessage: string,
  errorName: ErrorName,
): Promise<T>;

async function safe<T>(
  value: Promise<T>,
  argument2:
    | ((error: any) => [errorMessage: string, errorName: ErrorName])
    | string,
  argument3?: ErrorName,
): Promise<T | void> {
  try {
    const resolvedValue = await value;
    return resolvedValue;
  } catch (error) {
    if (typeof argument2 === "function") {
      const [errorMessage, errorName] = argument2(error);
      throw new (getErrorConstructor(errorName))(errorMessage, error as Error);
    } else if (typeof argument2 === "string" && argument3) {
      throw new (getErrorConstructor(argument3))(argument2, error as Error);
    }
  }
}

export default safe;
