# State management

Handle your state with typed actions.

## Features

- Async dispatches
- Typed actions (to request a change of state)
- Stores are classes
- Made for DI Containers via interface
- Listen for store changes

## Quick Example
Define an action:

```typescript
export class LoginAction {
  constructor(public userName: string, public password: string) {}
}
```

Define a store:

```typescript
import { Store, handle } from "fw-state";

// the file that the above action is defined in...
import { LoginAction } from "./actions"; 

export class MyStore1 extends Store<{ loggedIn: boolean }> {
  defaultState() {
    return {
      loggedIn: false,
    };
  }

  @handle(LoginAction)
  private async handleLogin(action: LoginAction) {
    // you can await network calls here..  or perform other logic

    // if you want too, throw
    if (someError) {
      throw new Error("Could not log in");
    }

    // when you are satisifed, you can update the state of this store..
    this.setState(state => ({
      ...state,
      loggedIn: true,
    }));
  }
}
```

Before you can dispatch to stores, you must set them up.

```typescript
import { setupStores } from "fw-state";

setupStores(containerInstance,
  MyStore1,
  MyStore2,
);
```

Now we can dispatch:

```typescript
import { dispatch } from "fw-state";
import { LoginAction } from "./actions";

await dispatch(new LoginAction("user", "password"));
```

You can `await` your dispatch (if you want) or just fire and forget..

Dispatching will call all of the handlers on every store that handles it.

Example:

```typescript
// in your actions
export class LogoutAction {}


// in a store:
// ....

  @handle(LogoutAction)
  private handleLogout() {
    this.setState(_ => this.defaultState());
  }

// ....
```

Accessing state is as easy as:

```typescript
const myStore1 = containerInstance.get(MyStore1);

const { loggedIn } = myStore1.state;
console.log(loggedIn ? "Hi!!" : "Please Log In");
```

## Listen for changes

If you need to, you can manually listen to changes with:

```typescript
const myStore1 = containerInstance.get(MyStore1);

const disposer = myStore1.onStateChanged(() => {
  // state changed
});

// when you are done:
disposer.dispose();
```