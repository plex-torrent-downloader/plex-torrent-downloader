describe('Settings Page', () => {
  it('Initial Setup', () => {
    cy.task('clearCollections');
    cy.task('clearSettings');
    cy.intercept('POST', 'http://localhost:3000/setup*', (req) => {
      // For URL-encoded form data, we need to parse it
      const bodyStr = req.body;

      // Validate the URL-encoded form data
      expect(bodyStr).to.include('fileSystemRoot=%2F');
      expect(bodyStr).to.include('username=admin');
      expect(bodyStr).to.include('password=fdsafads');
      expect(bodyStr).to.include('searchEngine=1377x.to');
      expect(bodyStr).to.include('cacheSearchResults=on');

      req.continue();
    }).as('setupRequest');

    cy.visit('http://localhost:3000/');
    cy.get('[data-testid="plexContentRoot"]').type('/');
    cy.get('[data-testid="saveDownloadHistory"]').click();
    cy.get('[data-testid="password"]').type('fdsafads');

    cy.get('[data-testid="saveSettings"]').click();

    cy.wait('@setupRequest').then((interception) => {
      expect(interception.response.statusCode).to.equal(204);
    });

    cy.task('getSettings').then((settings) => {
      expect(settings).to.not.be.null;
      expect(settings.fileSystemRoot).to.equal('/');
      expect(settings.searchEngine).to.equal('1377x.to');
      expect(settings.cacheSearchResults).to.be.true;
      expect(settings.saveDownloadHistory).to.be.false;
      expect(settings.password).to.not.be.null;
    });

    cy.url().should('include', '/collections');
  });
});
