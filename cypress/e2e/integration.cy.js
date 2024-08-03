describe('Integration Test', () => {
  it('should fetch medal data and calculate points', () => {
    cy.visit('../../public/index.html')
    cy.window().then((win) => {
      cy.stub(win, 'fetch').resolves({
        json: () => Promise.resolve({
          results: [
            {
              country: { name: 'CountryA', iso_alpha_2: 'CA' },
              medals: { gold: 1, silver: 2, bronze: 3 }
            }
          ]
        })
      });
      win.fetchMedalData().then((data) => {
        const points = win.calculatePoints(data);
        expect(points).to.have.length(1);
        expect(points[0]).to.have.property('country', 'CountryA');
        expect(points[0]).to.have.property('points', 53);
      });
    });
  });
});
