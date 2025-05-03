describe('Login Page', () => {
  it('Login', () => {
    cy.task('setSettings', "$2b$10$J64OJazXxEDBNsi//erPveGbrEWbxpsM0Az2kd5M2KGcumyJLY//q");
    cy.intercept('POST', 'http://localhost:3000/login*', (req) => {
      req.continue();
    }).as('submit');
    cy.visit('http://localhost:3000/');
    cy.url().should('include', '/login');
    //cy.get('[data-testid="username"]').type('/');
    cy.get('[data-testid="password"]').clear().type('abcdefg');
    cy.get('[data-testid="submit"]').click();

    cy.wait('@submit');

    cy.url().should('include', '/search');
  });
});
