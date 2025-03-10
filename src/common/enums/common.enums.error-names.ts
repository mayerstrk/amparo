const enum ErrorName {
    badRequest = "BadRequestError",
    validation = "ValidationError",
    notFound = "NotFoundError",
    cast = "CastError",
    duplicateKey = "DuplicateKeyError",
    authentication = "AuthenticationError",
    authorization = "AuthorizationError",
    internalServerError = "InternalServerError",
    forbidden = "ForbiddenError",
    conflict = "ConflictError",
}

export { ErrorName }
