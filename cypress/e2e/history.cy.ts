describe('History Page', () => {
  it('Can see History', () => {
    cy.task('setSettings');
    cy.task('setHistory');

    cy.visit('http://localhost:3000/history');

    cy.get('[data-testid="torrent"]').should('exist')
        .contains('edubuntu-24.04.2-desktop-amd64.iso');
  });

  it('Can delete history item', () => {
    cy.task('setSettings');
    cy.task('setHistory');

    cy.visit('http://localhost:3000/history');

    cy.get('[data-testid="torrent"]').should('exist')
        .click();

    cy.get('[data-testid="torrent-actionDelete History Item"]').click();

    cy.task('getDownloadHistory').then((history) => {
      expect(history.length).to.equal(0);
    });
  });

  it('Can re download an item', () => {
    cy.task('setSettings');
    cy.task('setHistory');

    cy.visit('http://localhost:3000/history');

    cy.get('[data-testid="torrent"]').click();

    cy.get('[data-testid="torrent-actionRe-Seed"]').click();

    cy.wait(5000);

    cy.get('[data-testid="modal"]').should('exist')
        .and('contain', 'The torrent is queued to download or reseed.');

    cy.get('[data-testid="notification"]').should('exist')
        .contains('Downloading edubuntu-24.04.2-desktop-amd64.iso');

    cy.visit('http://localhost:3000/queue');

    cy.get('[data-testid="torrent"] > .relative').click();

    cy.get('[data-testid="torrent-actionDelete all Files"]').click();

    cy.get('[data-testid="notification"]').should('exist')
        .last()
        .contains('edubuntu-24.04.2-desktop-amd64.iso has been deleted.');

  });
});
