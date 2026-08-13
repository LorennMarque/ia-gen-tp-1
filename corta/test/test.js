const { expect } = require('chai');
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

describe('Corta', () => {
  let codigo, corta;

  describe('POST /api/links', () => {
    it('crea un link corto', async () => {
      const res = await axios.post(`${BASE_URL}/api/links`, {
        url: 'https://www.google.com'
      });
      expect(res.status).to.equal(200);
      expect(res.data).to.have.property('codigo');
      expect(res.data).to.have.property('corta');

      codigo = res.data.codigo;
      corta = res.data.corta;
    });
  });

  describe('GET /:codigo', () => {
    it('redirige al destino', async () => {
      const res = await axios.get(`${BASE_URL}${corta}`, {
        maxRedirects: 0,
        validateStatus: () => true
      });
      expect(res.data).to.equal('https://www.google.com');
    });
  });

  // TODO probar los clicks
  // TODO probar stats cuando este hecho el endpoint
});
