describe('Jellyfin Integrations', () => {
  beforeEach(() => {
    cy.task('setSettings');
    cy.task('clearJellyfinServers');
  });

  it('shows empty state when no servers configured', () => {
    cy.visit('http://localhost:3000/jellyfin-integrations');
    cy.contains('No Jellyfin servers configured').should('exist');
  });

  it('can add a jellyfin server', () => {
    cy.visit('http://localhost:3000/jellyfin-integrations');

    cy.get('[data-testid="addServer"]').click();

    cy.get('[data-testid="serverName"]').type('Home Server');
    cy.get('[data-testid="serverUrl"]').type('http://192.168.1.100:8096');
    cy.get('[data-testid="serverApiKey"]').type('myapikey123');

    cy.get('[data-testid="submitServer"]').click();

    cy.contains('Server added successfully').should('exist');

    cy.task('getAllJellyfinServers').then((servers: any[]) => {
      expect(servers.length).to.equal(1);
      expect(servers[0].name).to.equal('Home Server');
      expect(servers[0].url).to.equal('http://192.168.1.100:8096');
    });
  });

  it('can edit a jellyfin server', () => {
    cy.task('setJellyfinServers');

    cy.visit('http://localhost:3000/jellyfin-integrations');

    cy.get('[data-testid="editServer"]').first().click();

    cy.get('[data-testid="serverName"]').clear().type('Updated Server');

    cy.get('[data-testid="submitServer"]').click();

    cy.contains('Server updated successfully').should('exist');

    cy.task('getAllJellyfinServers').then((servers: any[]) => {
      expect(servers[0].name).to.equal('Updated Server');
    });
  });

  it('can delete a jellyfin server', () => {
    cy.task('setJellyfinServers');

    cy.visit('http://localhost:3000/jellyfin-integrations');

    cy.contains('Test Server').should('exist');

    cy.get('[data-testid="deleteServer"]').first().click();

    cy.contains('Test Server').should('not.exist');

    cy.task('getAllJellyfinServers').then((servers: any[]) => {
      expect(servers.length).to.equal(0);
    });
  });
});