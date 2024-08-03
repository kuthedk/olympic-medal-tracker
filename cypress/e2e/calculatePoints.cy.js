describe('calculatePoints', () => {
  it('should correctly calculate points based on medals', () => {
    cy.visit('../../public/index.html')
    cy.window().then((win) => {
      const testData = [
        { country: 'CountryA', gold: 1, silver: 2, bronze: 3 },
        { country: 'CountryB', gold: 2, silver: 1, bronze: 0 },
        { country: 'CountryC', gold: 0, silver: 0, bronze: 1 },
      ];
      const points = win.calculatePoints(testData);
      expect(points).to.have.length(3);
      expect(points[0].country).to.equal('CountryB');
      expect(points[0].points).to.equal(60);
      expect(points[1].country).to.equal('CountryA');
      expect(points[1].points).to.equal(57);
      expect(points[2].country).to.equal('CountryC');
      expect(points[2].points).to.equal(4);
    });
  });
});
