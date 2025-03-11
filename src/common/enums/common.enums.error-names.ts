const enum ErrorName {
  badrequest = "badrequesterror",
  validation = "validationerror",
  notfound = "notfounderror",
  cast = "casterror",
  duplicatekey = "duplicatekeyerror",
  authentication = "authenticationerror",
  authorization = "authorizationerror",
  internalservererror = "internalservererror",
  forbidden = "forbiddenerror",
  conflict = "conflicterror",
}

export { ErrorName };
