import React, { Component } from 'react';
import { observer } from 'mobx-react';
import axios from 'axios';
import { ResourceStore } from '@reststate/mobx';

const token =
  'caeff36e945a13e4f26a19f8de4430360eb94bc34ec8409a2871f0f596e9d0a7';

const httpClient = axios.create({
  baseURL: 'https://sandboxapi.codingitwrong.com',
  headers: {
    'Content-Type': 'application/vnd.api+json',
    'Authorization': `Bearer ${token}`,
  },
});

const postStore = new ResourceStore({
  name: 'posts',
  httpClient,
});

class App extends Component {
  state = { title: '' }

  componentDidMount() {
    postStore.loadAll();
  }

  updateTitle = (event) => {
    this.setState({ title: event.target.value });
  }

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

  render() {
    if (postStore.loading) {
      return (
        <p>Loading…</p>
      );
    } else if (postStore.error) {
      return (
        <p>Error loading posts.</p>
      );
    } else {
      return (
        <div>
          <form onSubmit={this.createPost}>
            <input
              type="text"
              value={this.state.title}
              onChange={this.updateTitle}
            />
            <button>Create</button>
          </form>
          <ul>
            {
              postStore.all().map(post => (
                <li key={post.id}>
                  {post.attributes.title}
                  <button
                    onClick={() => post.delete()}
                  >
                    Delete
                  </button>
                </li>
              ))
            }
          </ul>
        </div>
      );
    }
  }
}

export default observer(App);