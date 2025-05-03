describe('Collections Page', () => {
  it('Can Save Collections', () => {
    cy.task('clearSettings');
    cy.task('setSettings');
    cy.task('clearCollections');

    cy.intercept('POST', 'http://localhost:3000/collections', (req) => {
      req.continue();
    }).as('saveRequest');

    cy.visit('http://localhost:3000/collections');
    cy.get('[data-testid="collectionName"]').clear().type('Movies');
    cy.get('[data-testid="collectionLocation"]').clear().type('[content_root]/tmp');
    cy.get('[data-testid="saveCollections"]').click();

    cy.wait('@saveRequest').then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });

    cy.task('getAllCollections').then((collections) => {
      const collection = collections[0];
      expect(collections.length).to.equal(1);
      expect(collection.name).to.equal('Movies');
      expect(collection.location).to.equal('[content_root]/tmp');
    });

    cy.get('[data-testid="modal"]').should('exist')
        .contains('Collections saved successfully')
        .should('be.visible');
  });
});
