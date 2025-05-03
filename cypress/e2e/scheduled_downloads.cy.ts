describe('Scheduled Downloads', () => {
  it('Can Schedule a download', () => {
    cy.task('setSettings');
    cy.task('clearScheduledDownloads');

    cy.intercept('POST', 'http://localhost:3000/scheduled_downloads*', (req) => {
      req.continue();
    }).as('submit');

    cy.visit('http://localhost:3000/scheduled_downloads');

    cy.get('[data-testid="searchTerm"]').type('Mulan');
    cy.get('[data-testid="engine"]').select('1377x.to');
    cy.get('[data-testid="seasonNumber"]').type('1');
    cy.get('[data-testid="episodeNumber"]').type('1');
    cy.get('[data-testid="dayOfWeek"]').select('Monday');
    cy.get('[data-testid="collection"]').select('Movies');

    cy.get('[data-testid="submit"]').click();

    cy.wait('@submit');

    cy.get('[data-testid="modal"]').should('exist')
         .contains('Scheduled download added successfully');
  });
});
