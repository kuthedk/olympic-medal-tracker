describe('fetchMedalData', () => {
  it('should fetch medal data and verify its structure', () => {
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
        expect(data).to.have.length(1);
        expect(data[0]).to.have.property('country', 'CountryA');
        expect(data[0]).to.have.property('gold', 1);
        expect(data[0]).to.have.property('silver', 2);
        expect(data[0]).to.have.property('bronze', 3);
      });
    });
  });
});
