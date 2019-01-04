# Tutorial

Let's walk through setting up a zero-configuration data layer in React using `@reststate/mobx`.

Create a new React app using [Create React App](https://github.com/facebook/create-react-app):

```sh
$ create-react-app reststate-mobx-tutorial
```

Next, add the required libraries for  `@reststate/mobx`, MobX itself, as well as the `axios` library for handling the web service requests:

```sh
$ yarn add mobx mobx-react @reststate/mobx axios
```

Next, we want to use `@reststate/mobx` to create a MobX store object for handling posts. The JSON:API web service we'll be connecting to is [sandboxapi.reststate.org](https://sandboxapi.reststate.org/), a free service that allows you to create an account so you can write data as well as read it. Sign up for an account there.

Next, we need to get a token to authenticate with. We aren't going to build a login form as part of this tutorial. Instead, use a web service client app like [Postman](https://www.getpostman.com/) to send the following request:

```
POST https://sandboxapi.reststate.org/oauth/token

grant_type=password
username=you@yourodmain.com
password=yourpassword
```

You'll receive back a response like:

```json
{
    "access_token": "b027b3ed38739a1d01c2ac05008f0cb4e7a764acc802e0cfb1e5bf1a4876597c",
    "token_type": "bearer",
    "expires_in": 7200,
    "created_at": 1531855327
}
```

Let's set up an `axios` client with that access token to handle the web service connection. Add the following to `src/App.js`:

```javascript
import { observer } from 'mobx-react';
import axios from 'axios';
import { ResourceStore } from '@reststate/mobx';

const token = '[the token you received from the POST request above]';

const httpClient = axios.create({
  baseURL: 'https://sandboxapi.reststate.org',
  headers: {
    'Content-Type': 'application/vnd.api+json',
    'Authorization': `Bearer ${token}`,
  },
});

const postStore = new ResourceStore({
  name: 'posts',
  httpClient,
});
```

That's all we have to do to set up our data layer! Now let's put it to use.

Let's set up a component to display a list of the posts. Replace the `App` component with the following:

```jsx
class App extends Component {
  componentDidMount() {
    postStore.loadAll();
  }

  render() {
    return (
      <div>
        <ul>
          {
            postStore.all().map(post => (
              <li key={post.id}>{post.attributes.title}</li>
            ))
          }
        </ul>
      </div>
    );
  }
}

export default observer(App);
```

Notice a few things:

- We call a `loadAll` method to request the data from the server in the `componentDidMount` hook.
- We use an `all` method to synchronously access the data for rendering.
- The post's ID is available as a property on the `post` directly, but its title is under a `post.attributes` object. This is the standard JSON:API resource object format, and to keep things simple `@reststate/mobx` exposes resources in the same format as JSON:API.
- We wrap the `App` component with a call to mobx-react's `observer()` function. This configures it to be rerendered reactively when the data in `postStore.all()` changes.

Run the app and you'll see some sample posts that were created by default for you when you signed up for a Sandbox API account.

A nice enhancement we could do would be to show the user when the data is loading from the server, or if it has errored out. Our store has properties for this. Update the render method as follows:

```diff
   render() {
+    if (postStore.loading) {
+      return <p>Loading…</p>;
+    }
+    if (postStore.error) {
+      return <p>Error loading posts.</p>;
+    }
     return (
       <div>
         <ul>
           {
             postStore.all().map(post => (
               <li key={post.id}>
                 {post.attributes.title}
               </li>
             ))
           }
         </ul>
       </div>
     );
   }
```

Now reload the page and you should briefly see the "Loading" message before the data loads. If you'd like to see the error message, change the `baseURL` to some incorrect URL, and the request to load the data will error out.

Now that we've set up reading our data, let's see how we can write data. Let's allow the user to create a new post. To keep things simple for the example, we'll just save a title field.

Create a state property to store the title being edited:

```diff
 class App extends Component {
+  state = { title: '' }
+
   componentDidMount() {
```

Add a simple form to the top of the template:

```diff
 return (
   <div>
+    <form onSubmit={this.createPost}>
+      <input
+        type="text"
+        value={this.state.title}
+        onChange={this.updateTitle}
+      />
+      <button>Create</button>
+    </form>
     <ul>
```

Now implement the "controlled component" method to record updates to the title in the state:

```javascript
updateTitle = (event) => {
  this.setState({ title: event.target.value });
}
```

Finally, implement `createPost` to save the post using the store:

```javascript
createPost = (event) => {
  event.preventDefault();
  postStore.create({
    attributes: {
      title: this.state.title,
    },
  }).then(() => {
    this.setState({ title: '' });
  });
}
```

Notice a few things:

- The object we pass to `postStore.create` follows the JSON:API resource object format: the attributes are under an `attributes` object. (If you know JSON:API, you may notice that we aren't passing a `type` property, though--`@reststate/mobx` can infer that from the fact that we're in the `posts` module.)
- We clear out the title after the `create` operation succeeds.

Run the app and you should be able to submit a new post, and it should appear in the list right away. This is because `@reststate/mobx` automatically adds it to the local store of posts; you don't need to do that manually.

Finally, let's make a way to delete posts. Add a delete button to each list item:

```diff
 <li key={post.id}>
   {post.attributes.title}
+  <button onClick={() => post.delete()}>
+    Delete
+  </button>
 </li>
```

This time we don't need a method on the component; we can just call the method directly on the post object. Try it out and you can delete records from your list. They're removed from the server and from your local MobX store.

With that, our tutorial is complete. Notice how much functionality we got without needing to write any custom store code! JSON:API's conventions allow us to use a zero-configuration library like `@reststate/mobx`  to focus on our application and not on managing data.
