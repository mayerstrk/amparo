const enum ErrorName {
  badRequest = "badrequesterror",
  validation = "validationerror",
  notFound = "notfounderror",
  cast = "casterror",
  duplicatekey = "duplicatekeyerror",
  authentication = "authenticationerror",
  authorization = "authorizationerror",
  internalServerError = "internalservererror",
  forbidden = "forbiddenerror",
  conflict = "conflicterror",
}

export { ErrorName };
