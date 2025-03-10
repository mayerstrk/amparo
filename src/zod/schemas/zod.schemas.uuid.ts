import z from "zod"

const uuidSchema = z.string().uuid().nonempty()

const isUuid = (value: unknown): value is string =>
    uuidSchema.safeParse(value).success

export { uuidSchema, isUuid }
