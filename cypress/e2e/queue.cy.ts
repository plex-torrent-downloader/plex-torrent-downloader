import exp = require("constants");

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

    // Wait for the torrent to be processed and added to download history
    // Retry until history is populated (handles async processing)
    const checkHistory = (retries = 0, maxRetries = 20) => {
      cy.task('getDownloadHistory').then((history) => {
        if (history.length === 0 && retries < maxRetries) {
          cy.wait(500);
          checkHistory(retries + 1, maxRetries);
        } else {
          const downloaded = history[0];
          expect(history.length).to.equal(1);
          expect(downloaded.name).to.equal('edubuntu-24.04.2-desktop-amd64.iso');
          expect(downloaded.hash).to.equal('8f082230ceac2695b11b5617a574ea76f4f2d411');
          expect(downloaded.pathOnDisk).to.equal('/tmp');
          expect(downloaded.createdAt).to.exist;
          expect(downloaded.updatedAt).to.exist;
        }
      });
    };
    checkHistory();

    cy.get('[data-testid="notification"]').should('exist')
        .contains('Downloading edubuntu-24.04.2-desktop-amd64.iso');

    cy.get('[data-testid="modal-close"]').click();

    cy.get('[data-testid="sidebarToggle"]').click();

    cy.get('[data-testid="sidebar-Queue(1)"] > .truncate')
        .should('exist')
        .contains('Queue (1)');

    cy.get('[data-testid="torrent"] > .relative').click();

    cy.get('[data-testid="torrent-actionDelete all Files"]').click();

    cy.get('[data-testid="notification"]').should('exist')
        .last()
        .contains('edubuntu-24.04.2-desktop-amd64.iso has been deleted.');

  });
});
