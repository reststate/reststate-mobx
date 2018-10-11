class Resource {
  constructor({ record, client }) {
    this.client = client;
    Object.assign(this, record);
  }

  save() {
    const { type, id, attributes, relationships } = this;
    return this.client.update({ type, id, attributes, relationships });
  }

  delete() {
    return this.client.delete({ id: this.id });
  }
}

module.exports = Resource;
