describe('smoke test', () => {
  it('works', () => {
    cy.visit('http://localhost:3000');
    cy.title().should('eq', 'React App');
  });
});
