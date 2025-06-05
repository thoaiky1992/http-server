# @thoaiky1992/http-server

The package simplifies creating `RESTful API` in `TypeScript` with `Decorators`, enabling automatic handling of routes, request parameters, and validations. It is built on top of `Express.js`, leveraging its capabilities while adding higher-level abstractions for easier API development.

# Table of Contents

- [Installation](#installation)
- [Example of usage](#example-of-usage)
- [Middlewares](#middlewares)
- [Inject routing parameters](#inject-routing-parameters)
- [Protect route (Authentication, Authorization, ...)](#protect-route)
- [Request body validation](#request-body-validation)
- [Dependency Injection](#dependency-injection)
- [HttpException](#httpexception)
- [Custom decorator](#custom-decorator)

## Installation

> ### Package requires Node.js verion >= 20.11.1

#### 1. Install module:

```shell
npm install @thoaiky1992/http-server
```

#### 2. `reflect-metadata` shim is required:

```shell
npm install reflect-metadata
```

And make sure to import it before you use `@thoaiky1992/http-server`:

```typescript
import 'reflect-metadata';
```

#### 3. Install peer dependencies and typings:

```shell
npm install dotenv
npm install -D @types/express @types/multer
```

#### 4. Its important to set these options in `tsconfig.json` file of your project:

```json
{
  "emitDecoratorMetadata": true,
  "experimentalDecorators": true,
  "useDefineForClassFields": false
}
```

## Example of usage

The package is designed to **automatically scan** for a folder named `controllers` and filter and process files with the `.controller.ts` extension.

When running in a `production environment`, the application will process the compiled `.controller.js` files (instead of `.ts` files) to ensure optimal performance.

To enable production mode, you need to set the `NODE_ENV` environment variable to `production` during the start phase.

#### How It Works:

1. During **development**:
   - The package scans the `src/controllers` folder for `.controller.ts` files.
   - These files are used directly for development purposes.
2. During **production**:
   - The `NODE_ENV=production` flag instructs the package to scan the `dist/controllers` folder for `.controller.js` files.
   - This ensures that only precompiled and optimized files are executed, improving performance.
   - Ex: `NODE_ENV=production node dist/index.js`

#### 1. The project folder structure:

```txt
📦 your-project
 ┣ 📂 src
 ┃ ┣ 📂 controllers
 ┃ ┃ ┣ 📜 user.controller.ts
 ┃ ┃ ┣ 📜 assume-role.controller.ts
 ┃ ┃ ┗ 📜 ...
 ┃ ┣ 📂 services
 ┃ ┃ ┣ 📜 user.service.ts
 ┃ ┃ ┗ 📜 assume-role.service.ts
 ┃ ┣ 📂 ...
 ┃ ┣ 📜 index.ts
 ┃ ┗ 📜 type.d.ts
 ┣ 📜 package.json
 ┣ 📜 package-lock.json
 ┗ 📜 tsconfig.json
```

#### 2. Create a file `src/index.ts`

```typescript
import 'reflect-metadata';
import 'dotenv/config';
import path from 'path';
import { EnableServer, HttpServer } from '@thoaiky1992/http-server';
import bodyParser from 'body-parser';

@EnableServer()
class App extends HttpServer {
  constructor(port: number) {
    super(port);
  }
}
const PORT = Number(process.env.PORT || 3000);
const app = new App(PORT);
// app.setPrefixApi('/api/v1') // If not set, the default will be '/api'
app.applyMiddlewares([bodyParser.json({ limit: '20mb' })]);
app.start();
```

#### 3. Create a file `src/controllers/test.controller.ts`

```typescript
import { Controller, GET } from '@thoaiky1992/http-server';

@Controller('test')
export default class TestController {
  @GET('/say-hello')
  getHello() {
    return 'Hello world !!!';
  }
}
```

_Example:_ [http://localhost:3000/api/test/say-hello](http://localhost:3000/api/test/say-hello)

![image](https://res.cloudinary.com/dhgwmvu7l/image/upload/v1733236685/uqpkj1yzdtfmmomkpbho.png)

## Middlewares

#### 1. `applyMiddlewares`

This method is used to apply an array of middleware functions to your Express application. Middleware functions are executed in the order they are added, and they can perform various tasks such as logging, authentication, parsing request bodies, etc... In your example, `applyMiddlewares` is used to apply compression, helmet, and authMiddleware, etc ... to the app.

```typescript
import 'reflect-metadata';
import path from 'path';
import { EnableServer, HttpServer } from '@thoaiky1992/http-server';
import { NextFunction, Request, Response } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import bodyParser from 'body-parser';

@EnableServer()
class App extends HttpServer {
  constructor(port: number) {
    super(port);
  }
}
const PORT = Number(process.env.PORT || 3000);
const app = new App(PORT);

function handleAuthMiddleware(req: Request, _: Response, next: NextFunction) {
  req.user = { id: 1, email: 'thoaiky1992@gmail.com', name: 'Thoaiky' };
  next();
}

const middlewares = [bodyParser.json({ limit: '20mb' }), compression(), helmet(), handleAuthMiddleware];
app.applyMiddlewares(middlewares);
app.start();
```

#### 2. `applyErrorMiddleware`

This method is specifically for applying error-handling middleware. Error-handling middleware functions have four arguments: (err, req, res, next). They are used to handle errors that occur during the execution of the application. In your example, applyErrorMiddleware is used to apply `errorMiddleware`, which logs the error and sends a JSON response with the error status and message.

```typescript
import 'reflect-metadata';
import path from 'path';
import { EnableServer, HttpException, HttpServer, ErrorRequestHandler } from '@thoaiky1992/http-server';
import { Request, Response, NextFunction } from 'express';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

@EnableServer()
class App extends HttpServer {
  constructor(port: number) {
    super(port);
  }
}
const PORT = Number(process.env.PORT || 3000);
const app = new App(PORT);

function errorMiddleware(error: HttpException, _: Request, res: Response, __: NextFunction) {
  // write log , ....
  const statusCode = error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = error?.message || getReasonPhrase(statusCode);
  return res.status(statusCode).json({ statusCode, message });
}
app.applyErrorMiddleware(errorMiddleware);
app.start();
```

## Inject routing parameters

#### 1. `@Req()`, `Res()`

`@Req()`: This decorator is used to inject the Express Request object into your method. It allows you to access details about the incoming HTTP request, such as headers, query parameters, and the request body.

```typescript
import { Controller, GET, Req } from '@thoaiky1992/http-server';
import { Request } from 'express';

@Controller('test')
export default class TestController {
  @GET('/say-hello')
  getHello(@Req() request: Request) {
    console.log(request.headers);
    return 'Hello world !!!';
  }
}
```

`@Res()`: This decorator is used to inject the Express Response object into your method. It allows you to send a response back to the client, including setting the status code and sending JSON data or other types of responses.

```typescript
import { Controller, GET, Res } from '@thoaiky1992/http-server';
import { Response } from 'express';

@Controller('test')
export default class TestController {
  @GET('/say-hello')
  getHello(@Res() response: Response) {
    return response.status(200).json({ message: 'Hello world !!!' });
  }
}
```

#### 2. `@Body()`, `@Params()`, `@Query()`

`@Body()`: This decorator is used to inject the body of the HTTP request into your method. It allows you to access and use the data sent by the client in the request body, typically used in POST or PUT requests.

```typescript
import { Controller, POST, Body, Res } from '@thoaiky1992/http-server';
import { Response } from 'express';

@Controller('users')
export default class UserController {
  @POST()
  createUser(@Body() body: UserDTO, @Res() response: Response) {
    const user = await userService.createUser(body);
    return response.status(201).json({ data: user });
  }
}
```

`@Params()`: This decorator is used to inject route parameters into your method. It allows you to access dynamic segments of the URL, such as an ID in a route like /users/:id.

```typescript
import { Controller, GET, Params, Res } from '@thoaiky1992/http-server';
import { Response } from 'express';

@Controller('users')
export default class UserController {
  @GET(':id')
  createUser(@Params() params: IParams, @Res() response: Response) {
    const { id } = params;
    const user = await userService.getUserById(id);
    return response.status(200).json({ data: user });
  }
}
```

`@Query()`: This decorator is used to inject query parameters from the URL into your method. It allows you to access data sent in the query string of the URL, such as pagination or filtering parameters.

```typescript
import { Controller, GET, Res } from '@thoaiky1992/http-server';
import { Response } from 'express';

@Controller('users')
export default class UserController {
  @GET()
  createUser(@Query() query: IQuery, @Res() response: Response) {
    const { page } = query;
    const users = await userService.getManyUser(page);
    return response.status(200).json({ data: users });
  }
}
```

#### 3. `@UploadFile`, `@UploadMultiFile()`

The two decorators, `@UploadFile` and `@UploadMultiFile`, are used to handle file uploads via `Multer`, with `@UploadFile` for **single file** uploads and `@UploadMultiFile` for **multiple file** uploads.

```typescript
import { Controller, POST, Res, UploadFile, UploadMultiFile } from '@thoaiky1992/http-server';
import { Response } from 'express';

@Controller('files')
export default class TestController {
  @POST('/upload')
  uploadFile(@UploadFile('file') file: Express.Multer.File, @Res() response: Response) {
    console.log(file);
    return response.status(200).json({ message: 'File uploaded !!!' });
  }

  @POST('/bulk-upload')
  uploadMultiFile(@UploadMultiFile('files') files: Express.Multer.File[], @Res() response: Response) {
    console.log(files);
    return response.status(200).json({ message: 'Files uploaded !!!' });
  }
}
```

_Example:_

![image](https://res.cloudinary.com/dhgwmvu7l/image/upload/v1733192309/http-server/x8obiselayvu6erewmgb.png)
![image](https://res.cloudinary.com/dhgwmvu7l/image/upload/v1733200629/http-server/mxgcs57q2gnlnkgtjdcy.png)

## Protect route:

### 1. `@Authorized() + @ApplyProtectRoute()`

> ✅ There are two key components:
>
> - `@Authorized()`: Acts purely as a marker decorator, indicating which routes require protection.
> - `@ApplyProtectRoute()`: is a class decorator that takes a middleware as a parameter. This middleware contains all the actual logic for authentication and authorization (e.g., decoding JWT, validating roles, etc.).
> - There is`no logic inside` @Authorized() — it simply flags routes for the global/custom middleware to protect.

> 🔐 How It Works:
>
> 1. When a route is decorated with `@Authorized()`, the system checks whether the request should > be processed by a protection middleware.
> 2. The actual middleware is defined in `@ApplyProtectRoute()` at the application level.
> 3. This middleware handles:

    - Extracting and verifying JWT
    - Setting `req.user` (if needed)
    - Checking roles/permissions
    - Returning appropriate error responses (401 or 403)

#### 🧩 _Combined Example:_

```typescript
// 1. Custom authentication middleware
const ProtectRouteMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const user = await jwt.verify(token, JWT_SECRET);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    req.user = user;

    // Example permission check
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
```

```typescript
// 2. Define App with custom protect middleware
@EnableServer()
@ApplyProtectRoute(ProtectRouteMiddleware)
class App extends HttpServer {
  constructor(port: number) {
    super(port);
  }
}

const PORT = Number(process.env.PORT || 3000);
const app = new App(PORT);

app.applyMiddlewares([bodyParser.json({ limit: '20mb' })]);
app.start();
```

```typescript
import { Authorized, Controller, GET } from '@thoaiky1992/http-server';

@Authorized() // apply to all route
@Controller('users')
export default class UserController {
  @GET()
  getMany() {
    const users = await userService.getMany();
    return users;
  }

  @GET(':id')
  getOne(@Params() params: IParams) {
    const user = await userService.getOne(params.id);
    return user;
  }
}
```

```typescript
import { Authorized, Controller, GET } from '@thoaiky1992/http-server';

@Controller('users')
export default class UserController {
  @Authorized() // apply to this route
  @GET()
  getMany() {
    const users = await userService.getMany();
    return users;
  }

  @GET(':id')
  getOne(@Params() params: IParams) {
    const user = await userService.getOne(params.id);
    return user;
  }
}
```

### 2. `@AuthForRoutes()`

You can use `@AuthForRoutes()` + `CrudControllerRoutes` to check authorization when custom a `CrudController`.

```shell
CrudControllerRoutes:

{
  GetMany:    { method: 'get',    path: ''             },
  GetOne:     { method: 'get',    path: ':id'          },
  CreateOne:  { method: 'post',   path: ''             },
  CreateMany: { method: 'post',   path: '/bulk-create' },
  UpdateMany: { method: 'put',    path: ''             },
  UpdateOne:  { method: 'put',    path: ':id'          },
  DeleteMany: { method: 'delete', path: ''             },
  DeleteOne:  { method: 'delete', path: ':id'          }
};

```

_Example:_

```typescript
import { Controller, CrudControllerRoutes, Injectable, AppContainer, AuthForRoutes } from '@thoaiky1992/http-server';

const { GetMany, CreateMany } = CrudControllerRoutes;

@Injectable()
@AuthForRoutes([GetMany, CreateMany])
@Controller('users')
export default class UserController extends CrudController {
  userService: UserService;

  constructor() {
    this.userService = AppContainer.resolve(UserService);
    super(this.userService);
  }
}
```

## Request Body Validation

#### `@UseValidateBodyDTO`

The `@UseValidateBodyDTO` decorator uses `class-validator` package to validate data in the request body, ensuring compliance with constraints defined in a DTO class. If the data is invalid, the decorator returns an error. If valid, the original method is executed.

```typescript
import { Body, Controller, POST, UseValidateBodyDTO } from '@thoaiky1992/http-server';
import { IsEmail, IsNotEmpty, Max, Min } from 'class-validator';

class CreateUserDTO {
  @Max(50)
  @Min(10)
  @IsNotEmpty()
  username!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

@Controller('users')
export default class TestController {
  @UseValidateBodyDTO(CreateUserDTO)
  @POST()
  async createNewUser(@Body() createUserDTO: CreateUserDTO) {
    const newUser = await userService.createNewUser(createUserDTO);
    return newUser;
  }
}
```

> **NOTE:** The method decorator `@POST()` must be applied before validating the data. This means that `@UseValidateBodyDTO` should be placed above the route decorator to ensure that the request body data is validated before the route handler method is executed.

_Example:_

![image](https://res.cloudinary.com/dhgwmvu7l/image/upload/v1733193710/http-server/ipf5f3xvzrgvkuawtfn0.png)

## Dependency Injection

A lightweight dependency injection container for TypeScript/JavaScript for constructor injection via `tsyringe` package.

#### Example of usage:

```typescript
export default class UserService {
  getMany() {
    // do something, ...
    const user = await UserModel.find({}).exec();
    return user;
  }
}
```

```typescript
import { Injectable, Controller, Inject } from '@thoaiky1992/http-server';

// Class decorator factory that allows the class' dependencies to be injected at runtime. TSyringe relies on several decorators in order to collect metadata about classes to be instantiated.
@Injectable()
@Controller('users')
export default class UserController {
  constructor(@Inject(UserService) private userService: UserService) {}

  getMany() {
    const users = await this.userService.getMany();
    return users;
  }
}
```

## Custom decorator

You can create decorators for App class before the server start.

```typescript
import { IHttpServer } from '@thoaiky1992/http-server';

export function EnableMongoDB() {
  return function <T extends new (...args: any[]) => IHttpServer>(target: T) {
    return class extends target {
      constructor(...args: any[]) {
        super(...args);
      }

      async start(): Promise<void> {
        // do something ....
        await super.start();
      }
    };
  };
}
```

```typescript
import 'reflect-metadata';
import path from 'path';
import { EnableServer, HttpServer } from '@thoaiky1992/http-server';

@EnableServer()
@EnableMongoDB() // connect to mongoDB ....
class App extends HttpServer {
  constructor(port: number) {
    super(port);
  }
}
const PORT = Number(process.env.PORT || 3000);
const app = new App(PORT);
app.start();
```

## ⚖️ License

Released under [MIT](/LICENSE) by [@thoaiky](https://github.com/thoaiky1992).

#### Email: thoaiky1992@gmail.com
