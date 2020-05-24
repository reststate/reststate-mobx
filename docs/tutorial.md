# Tutorial

Let's walk through setting up a zero-configuration data layer in React using `@reststate/mobx`. To try it out, let's create a React webapp for rating dishes at restaurants. We'll call it "Opinion Ate".

Create a new React app using [Create React App](https://facebook.github.io/create-react-app/):

```sh
$ npx create-react-app opinion-ate-react
```

Next, let's add our data layer dependencies:

```sh
$ yarn add @reststate/mobx mobx mobx-react axios
```

In addition to Reststate/Mobx, these include:

- [`mobx` and `mobx-react`](https://mobx.js.org/) - for reactivity in React apps
- [`axios`](https://github.com/axios/axios) - a web service client

To demonstrate more of a realistic multi-page application, let's add [React Router](https://reacttraining.com/react-router/web/guides/quick-start) as well:

```sh
$ yarn add react-router-dom
```

Next, we want to use `@reststate/mobx` to create stores for handling restaurants and dishes. The JSON:API web service we'll be connecting to is [sandbox.howtojsonapi.com](https://sandbox.howtojsonapi.com/), a free service that allows you to create an account so you can write data as well as read it. Sign up for an account there.

Next, we need to get a token to authenticate with. We aren't going to build a login form as part of this tutorial. Instead, use a web service client app like [Postman](https://www.getpostman.com/) to send the following request:

```
POST https://sandbox.howtojsonapi.com/oauth/token

grant_type=password
username=you@yourodmain.com
password=yourpassword
```

You'll receive back a response like:

```json
{
  "access_token": "Hhd07mqAY1QlhoinAcKMB5zlmRiatjOh5Ainh90yWPI",
  "token_type": "bearer",
  "expires_in": 7200,
  "created_at": 1531855327
}
```

Let's set up an `axios` client with that access token to handle the web service connection. Create a `src/api.js` file and add the following:

```javascript
import axios from 'axios';

const token = '[the token you received from the POST request above]';

const httpClient = axios.create({
  baseURL: 'https://sandbox.howtojsonapi.com/',
  headers: {
    'Content-Type': 'application/vnd.api+json',
    Authorization: `Bearer ${token}`,
  },
});
```

Now we'll create a `src/stores.js` module and create Reststate stores for restaurants and dishes:

```js
import { ResourceStore } from '@reststate/mobx';
import api from './api';

const restaurantStore = new ResourceStore({
  name: 'restaurants',
  httpClient: api,
});

const dishStore = new ResourceStore({
  name: 'dishes',
  httpClient: api,
});

export { restaurantStore, dishStore };
```

That's all we have to do to set up our data layer! Now let's put it to use.

Let's set up the index route to display a list of the restaurants.

First, replace the content of `src/App.js` with the following:

```jsx
import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import RestaurantList from './RestaurantList';

function App() {
  return (
    <Router>
      <Route path="/" exact component={RestaurantList} />
    </Router>
  );
}

export default App;
```

This sets up a `RestaurantList` component to be rendered at the root of our app. Now let's create that component.

Create `src/RestaurantList.js` and add the following content:

```jsx
import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { restaurantStore } from './stores';

class RestaurantList extends Component {
  componentDidMount() {
    restaurantStore.loadAll();
  }

  render() {
    return (
      <div>
        <ul>
          {restaurantStore.all().map(restaurant => (
            <li key={restaurant.id}>{restaurant.attributes.name}</li>
          ))}
        </ul>
      </div>
    );
  }
}

export default observer(RestaurantList);
```

Notice a few things:

- We call the `loadAll()` method on the `restaurantStore` object to load our data. We do this in the `componentDidMount` lifecycle method.
- In the `render` method, we acccess the restaurants using the `all()` method of the store. We map over them and output them as usual.
- The restaurant's ID is available as a property on the `restaurant` directly, but its name is under a `restaurants.attributes` object. This is the standard JSON:API resource object format, and to keep things simple `@reststate/mobx` exposes resources in the same format as JSON:API.
- We wrap the returned component in `mobx-react`'s `observer()` function. This is what will cause React to rerender the component when the list of restaurants updates--we'll see how later.

Start the app:

```sh
$ yarn serve
```

Visit `http://localhost:3000` in your browser and you'll see some sample restaurants that were created by default for you when you signed up for a Sandbox API account.

A nice enhancement we could do would be to show the user when the data is loading from the server, or if it has errored out. To do this, let's check a few properties on the store in the template:

```diff
 render() {
+  if (restaurantStore.loading) {
+    return <p>Loading…</p>;
+  }
+  if (restaurantStore.error) {
+    return <p>Error loading restaurants.</p>;
+  }
   return (
     <div>
```

Now reload the page and you should briefly see the "Loading" message before the data loads. If you'd like to see the error message, change the `baseURL` in `api.js` to some incorrect URL, and the request to load the data will error out.

Now that we've set up reading our data, let's see how we can write data. Let's allow the user to create a new restaurant.

To do this, we'll create a `NewRestaurantForm` component. Create `src/NewRestaurantForm.js` and add the following typical React form. We'll handle actually creating the restaurant in a separate step:

```jsx
import React, { Component } from 'react';

const initialState = {
  name: '',
  address: '',
};

export default class NewRestaurantForm extends Component {
  state = initialState;

  updateField = field => event => {
    this.setState({ [field]: event.target.value });
  };

  createRestaurant = async event => {};

  render() {
    const { name, address } = this.state;
    return (
      <form onSubmit={this.createRestaurant}>
        <div>
          Name:
          <input type="text" value={name} onChange={this.updateField('name')} />
        </div>
        <div>
          Address:
          <input
            type="text"
            value={address}
            onChange={this.updateField('address')}
          />
        </div>
        <button>Create</button>
      </form>
    );
  }
}
```

Now let's hook this form up to our store:

```diff
 import React, { Component } from 'react';
+import { restaurantStore } from './stores';

 const initialState = {
...
   createRestaurant = async (event) => {
+    event.preventDefault();
+
+    const { name, address } = this.state
+    await restaurantStore.create({
+      attributes: { name, address },
+    });
+
+    this.setState(initialState);
  }
```

Notice a few things:

- The object we pass to `restaurantStore.create()` follows the JSON:API resource object format: the attributes are under an `attributes` object. (If you know JSON:API, you may notice that we aren't passing a `type` property, though--`@reststate/mobx` can infer that from the fact that we're in the `restaurants` store.)
- We clear out the name and address after the `create` operation succeeds.

To use this form, we just need to add it to our `RestaurantList`:

```diff
 import { restaurantStore } from './stores';
+import NewRestaurantForm from './NewRestaurantForm';

 class RestaurantList extends Component {
...
     return (
       <div>
+        <NewRestaurantForm />
         <ul>
```

Run the app and you should be able to submit a new restaurant, and it should appear in the list right away. `@reststate/mobx` automatically adds it to the local store of restaurants; you don't need to do that manually.

We said earlier that wrapping `RestaurantList` in `mobx-react`'s `observer()` function allowed it to rerender when the list of restaurants changes. How does this work? `observer()` creates a higher-order component that watches to see which MobX data is accessed during the `render()` method. Then, when any of that data changes, MobX tells the components to rerender, displaying the updated data. This happens without us needing to explicitly declare the `render` method's dependencies! (To learn more about how MobX reactivity works, react about [MobX Concepts and Principles](https://mobx.js.org/intro/concepts.html).)

Next, let's make a way to delete restaurants. Add a delete button to each list item:

```diff
 <li key={restaurant.id}>
   {restaurant.attributes.name}
+  <button onClick={() => restaurant.delete()}>
+    Delete
+  </button>
 </li>
```

This is all we need to do; the `restaurant` is a rich object with methods like `delete()` that will make the appropriate web service request and update the local store. Try it out and you can delete records from your list.

Let's wrap things up by showing how you can load related data: the dishes for each restaurant.

In `src/App.js`, add a new route to point to a restaurant detail component:

```diff
 import RestaurantList from './RestaurantList';
+import RestaurantDetail from './RestaurantDetail';
...
 <Router>
   <Route path="/" exact component={RestaurantList} />
+  <Route path="/restaurants/:id" exact component={RestaurantDetail} />
 </Router>
```

Create a new `src/RestuarantDetail.js` file for this component and start with the following:

```jsx
import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { restaurantStore } from './stores';

class RestaurantDetail extends Component {
  async componentDidMount() {}

  render() {}
}

export default observer(RestaurantDetail);
```

First let's retrieve the restaurant ID from the route and use it to load the restaurant with that ID when the component mounts:

```diff
 async componentDidMount() {
+  const { id } = this.props.match.params;
+  await restaurantStore.loadById({ id });
}
```

Now we can access that restaurant in the render function:

```diff
 render() {
+  const { id } = this.props.match.params;
+  const restaurant = restaurantStore.byId({ id });
+
+  if (!restaurant) {
+    return null;
+  }
+
+  return (
+    <div>
+      <h1>{restaurant.attributes.name}</h1>
+    </div>
+  );
}
```

Now to load the dishes related to the restaurant, we'll follow fairly analogus steps.

After we load the restaurant, we load its related dishes as well:

```diff
 async componentDidMount() {
   const { id } = this.props.match.params;
   await restaurantStore.loadById({ id });
+
+  const restaurant = restaurantStore.byId({ id });
+  await dishStore.loadRelated({ parent: restaurant });
}
```

Now we add those dishes to the render method:

```diff
 if (!restaurant) {
   return null;
 }

+const dishes = dishStore.related({ parent: restaurant });
+
 return (
   <div>
     <h1>{restaurant.attributes.name}</h1>
+    <ul>
+      {dishes.map(dish => (
+        <li key={dish.id}>
+          {dish.attributes.name}
+          -
+          {dish.attributes.rating} stars
+        </li>
+      ))}
+    </ul>
  </div>
);
```

Finally, let's link each restaurant in the list to its detail page:

```diff
 <li key={restaurant.id}>
-  {restaurant.attributes.name}
+  <Link to={`/restaurants/${restaurant.id}`}>
+    {restaurant.attributes.name}
+  </Link>
   <button onClick={() => restaurant.delete()}>
     Delete
   </button>
 </li>
```

Go back to the root of the app and click a link to go to a restauant detail page. You should see the dishes related to that restauant.

With that, our tutorial is complete. Notice how much functionality we got without needing to write any custom store code! JSON:API's conventions allow us to use a zero-configuration library like `@reststate/mobx` to focus on our application and not on managing data.
