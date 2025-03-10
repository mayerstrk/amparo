import { StatusCodes } from "http-status-codes";
import { ErrorName } from "../enums/common.enums.error-names";

abstract class CustomError extends Error {
  status: StatusCodes;

  name: ErrorName;

  cause?: Error;

  constructor(
    message: string,
    status: StatusCodes,
    name: ErrorName,
    cause?: Error,
  ) {
    super(message);
    this.status = status;
    this.name = name;
    Error.captureStackTrace(this, this.constructor);
    if (cause) {
      this.cause = cause;
    }
  }
}

class ValidationError extends CustomError {
  constructor(message: string | null, originalError?: Error) {
    super(
      message || "The input is not valid.",
      StatusCodes.BAD_REQUEST,
      ErrorName.validation,
      originalError,
    );
  }
}

class NotFoundError extends CustomError {
  constructor(message: string | null, originalError?: Error) {
    super(
      message || "The requested resource was not found.",
      StatusCodes.NOT_FOUND,
      ErrorName.notFound,
      originalError,
    );
  }
}

class CastError extends CustomError {
  constructor(message: string | null, originalError?: Error) {
    super(
      message || "Type casting error. ",
      StatusCodes.BAD_REQUEST,
      ErrorName.cast,
      originalError,
    );
  }
}

class DuplicateKeyError extends CustomError {
  constructor(message: string | null, originalError?: Error) {
    super(
      message || "A resource with that identifier already exists.",
      StatusCodes.BAD_REQUEST,
      ErrorName.duplicateKey,
      originalError,
    );
  }
}

class AuthenticationError extends CustomError {
  constructor(message: string | null, originalError?: Error) {
    super(
      message || "Authentication failed.",
      StatusCodes.UNAUTHORIZED,
      ErrorName.authentication,
      originalError,
    );
  }
}

class AuthorizationError extends CustomError {
  constructor(message: string | null, originalError?: Error) {
    super(
      message || "This action requires authorizaion.",
      StatusCodes.UNAUTHORIZED,
      ErrorName.authorization,
      originalError,
    );
  }
}

class ForbiddenError extends CustomError {
  constructor(message: string | null, originalError?: Error) {
    super(
      message ||
        "You don't have the neccesary permissions to perfom this action.",
      StatusCodes.FORBIDDEN,
      ErrorName.forbidden,
      originalError,
    );
  }
}

class ConflictError extends CustomError {
  constructor(message: string | null, originalError?: Error) {
    super(
      message || "A conflict occurred.",
      StatusCodes.CONFLICT,
      ErrorName.conflict,
      originalError,
    );
  }
}

class BadRequestError extends CustomError {
  constructor(message: string | null, originalError?: Error) {
    super(
      message || "Bad request.",
      StatusCodes.BAD_REQUEST,
      ErrorName.badRequest,
      originalError,
    );
  }
}

class InternalServerError extends CustomError {
  constructor(message: string | null, originalError?: Error) {
    super(
      message || "An unexpected server error occurred.",
      StatusCodes.INTERNAL_SERVER_ERROR,
      ErrorName.internalServerError,
      originalError,
    );
  }
}

type AppCustomErrorConstructor =
  | typeof ValidationError
  | typeof NotFoundError
  | typeof CastError
  | typeof DuplicateKeyError
  | typeof AuthenticationError
  | typeof AuthorizationError
  | typeof ForbiddenError
  | typeof ConflictError
  | typeof BadRequestError
  | typeof InternalServerError;

export type { AppCustomErrorConstructor };

export {
  CustomError,
  ValidationError,
  NotFoundError,
  CastError,
  DuplicateKeyError,
  AuthenticationError,
  AuthorizationError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  InternalServerError,
};
