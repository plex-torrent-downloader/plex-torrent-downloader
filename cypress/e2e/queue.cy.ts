describe('Download Queue', () => {
  it('Can Download', () => {
    cy.task('setSettings');
    cy.task('stageCollectionsForDelete');
    cy.task('clearHistory');

    cy.intercept('POST', 'http://localhost:3000/add', (req) => {
      req.continue();
    }).as('addTorrent');

    cy.visit('http://localhost:3000/queue');
    cy.get('[data-testid="torrent-actionAdd"]').click();
    cy.get('[data-testid="torrent-hash"]').clear().type('8f082230ceac2695b11b5617a574ea76f4f2d411');
    cy.get('[data-testid="torrent-collection"]').select('Movies');
    cy.get('[data-testid="torrent-start-download"]').click();
    cy.wait('@addTorrent');
    cy.get('[data-testid="success-modal"]').should('exist')
        .contains('The torrent is now downloading.');

  });
});
