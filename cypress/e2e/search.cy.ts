describe('Search Page', () => {
  it('Search and Download torrent', () => {
    cy.task('setSettings');
    cy.task('setCache');

    cy.intercept('GET', 'http://localhost:3000/search*', (req) => {
      req.continue();
    }).as('searchRequest');

    cy.intercept('POST', 'http://localhost:3000/add', (req) => {
      req.continue();
    }).as('addTorrent');

    cy.visit('http://localhost:3000/search');
    cy.get('[data-testid="searchInput"]').clear().type('Ubuntu');
    cy.get('[data-testid="searchButton"]').click();
    cy.wait('@searchRequest');

    cy.get('[data-testid="torrent"]').should('exist');

    cy.get('[data-testid="torrent"]').click();

    cy.get('[data-testid="torrent-collection"]').select('Movies');
    cy.get('[data-testid="torrent-start-download"]').click();
    cy.wait('@addTorrent');

    cy.wait(5000);

    cy.get('[data-testid="success-modal"]').should('exist')
        .contains('The torrent is now downloading.');

    cy.visit('http://localhost:3000/queue');

    cy.get('[data-testid="torrent"] > .relative').click();

    cy.get('[data-testid="torrent-actionDelete all Files"]').click();

    cy.get('[data-testid="notification"]').should('exist')
        .last()
        .contains('edubuntu-24.04.2-desktop-amd64.iso has been deleted.');
  });
});
