![Amparo Logo](https://github.com/mayerstrk/amparo/blob/main/556212E4-1A73-4B3D-8E2F-AFDA8EBBD088.tiff)

# amparo
> Making Express controllers incredibly clean, type-safe, and readable while handling all error cases elegantly.

amparo is a framework built to enforce type safety and simplify error handling in Express applications. It eliminates the need for try/catch blocks and promotes explicit response types for controller helpers, ensuring robust and predictable behavior. By abstracting repetitive patterns and focusing on readability, amparo empowers developers to write maintainable and elegant code.

## Core Value Propositions
### Strong Type Safety:
Enforce explicit response types for controller helpers, ensuring predictable and consistent API responses.
Use generics to eliminate type ambiguity and runtime errors.
### Elegant Error Handling:
Simplifies edge-case management without requiring try/catch blocks.
Allows for declarative and type-safe error handling with utilities like safe and assert.
### Readable Async Flows:
Transform async/await into expressive, maintainable flows.
Abstract away complex controller patterns while keeping the code concise and expressive.

---

## Key Features
### safe
The safe function ensures that asynchronous operations are robustly handled, with overloads to accommodate custom error handlers or throwing typed errors. This makes error handling declarative, type-safe, and clean.

#### Overloads and Examples
##### Using a Custom Error Handler:

```typescript
const result = await safe(
  asyncFunction(),
  (error) => ['Custom error message', ErrorName.internalServerError],
);
```

##### Throwing a Custom Error with a Message and Name:

```typescript
const result = await safe(
  asyncFunction(),
  'Operation failed',
  ErrorName.badRequest,
);
```

##### Generic Promise Resolution:

```typescript
const result = await safe(asyncFunction());
```

Each overload ensures the safe utility adapts to your needs while maintaining clarity and robustness in error handling.

### Explicit Response Types for Controller Helpers
Controllers in amparo enforce strict type safety by requiring explicit response types for all controller helpers. This ensures that all API responses are predictable and maintainable.

The following example demonstrates how amparo enforces explicit types and simplifies complex controller patterns:

```typescript
type ControllerHelper<T extends AppRequestVariant> = (
	request: AppRequest<T>,
	response: Response,
) => Promise<{
	request: AppRequest<T>;
	response: Response;
	data: unknown;
}>;

type ControllerBuilder = <T extends AppRequestVariant>(
	controllerHelper: ControllerHelper<T>,
) => (
	request: Request,
	responss: Response,
	next: NextFunction,
) => Promise<void>;
```

```typescript
import controllerBuilder from './controllerBuilder';

// === Sign in ===

const signInControllerHelper = async (
	request: AppRequest<SigninRequest>,
	response: Response,
) => {
	const {
		body: { email, password },
	} = request;

	const {
		rows: [{ user_id: userId, password: hashedPassword, name }],
	} = assertWithTypeguard(
		await safe(
			pool.query<Pick<User, 'user_id' | 'password' | 'name'>>(
				'SELECT user_id, password, name FROM protected.users WHERE email = $1',
				[email],
			),
			'Error querying user',
			ErrorName.internalServerError,
		),
		hasRowsInResult,
		'Invalid email or password',
		ErrorName.authentication,
	);

	assert(
		await bcrypt.compare(password, hashedPassword),
		'Invalid email or password',
		ErrorName.authentication,
	);

	const token = assert(
		jwt.sign({ _id: userId }, environment.JWT_SECRET),
		'Error signing token',
		ErrorName.internalServerError,
	);

	console.log('IN SIGN IN', token);

	response.cookie('token', token, {
		httpOnly: true,
		secure: true,
		domain: environment.API_DOMAIN,
		sameSite: 'strict',
		signed: true,
	});

	console.log('IN SIGN IN', JSON.stringify(response.get('Cookie')));

	console.log(name);

	return {
		request,
		response,
		data: { message: 'User signed in successfully', username: name },
	};
};

const signinController = controllerBuilder(signInControllerHelper);
```

Benefits Recap
Explicit Type Safety: Enforce response types to ensure consistent and predictable API behavior.
Elegant Error Handling: Simplify async error management without using try/catch.
Readable and Maintainable Code: Focus on core business logic with minimal boilerplate.
amparo empowers developers to write expressive, type-safe, and robust APIs by abstracting complexity and enforcing strict patterns, making it the perfect choice for modern Express applications.

