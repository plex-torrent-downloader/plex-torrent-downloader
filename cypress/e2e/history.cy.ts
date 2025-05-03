describe('History Page', () => {
  it('Can see History', () => {
    cy.task('setSettings');
    cy.task('setHistory');

    cy.visit('http://localhost:3000/history');

    cy.get('[data-testid="torrent"]').should('exist')
        .contains('Mulan');
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
});
