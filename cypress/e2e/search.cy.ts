describe('Search Page', () => {
  it('Search', () => {
    cy.task('setSettings');

    cy.intercept('GET', 'http://localhost:3000/search*', (req) => {
      req.continue();
    }).as('searchRequest');

    cy.visit('http://localhost:3000/search');
    cy.get('[data-testid="searchInput"]').clear().type('Mulan');
    cy.get('[data-testid="searchButton"]').click();
    cy.wait('@searchRequest');

    cy.get('[data-testid="torrent"]').should('exist');
  });
});
