export default class Resource {
  constructor({ record, client }) {
    this.client = client;
    Object.assign(this, record);
  }

  save() {
    const { id, attributes, relationships } = this;
    this.client.update({ id, attributes, relationships });
  }

  delete() {
    this.client.delete({ id: this.id });
  }
}
