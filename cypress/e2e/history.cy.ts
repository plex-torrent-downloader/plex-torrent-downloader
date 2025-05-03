describe('History Page', () => {
  it('Can see History', () => {
    cy.task('setSettings');
    cy.task('setHistory');

    cy.visit('http://localhost:3000/history');

    cy.get('[data-testid="torrent"]').should('exist')
        .contains('Mulan');
  });
});
