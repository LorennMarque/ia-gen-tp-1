const { expect } = require('chai');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp } = require('../src/server');
const { generarCodigo } = require('../src/utils');

describe('Corta', () => {
  let dbFile;
  let app;
  let generarCodigoFn;

  beforeEach(() => {
    dbFile = path.join(os.tmpdir(), `corta-test-${Date.now()}-${Math.random()}.json`);
    generarCodigoFn = generarCodigo;
    app = createApp({
      dbFile,
      generarCodigo: (...args) => generarCodigoFn(...args)
    });
  });

  afterEach(() => {
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
  });

  describe('persistencia / init', () => {
    it('inicializa links.json con [] si el archivo no existe', async () => {
      expect(fs.existsSync(dbFile)).to.equal(false);
      const res = await request(app)
        .post('/api/links')
        .send({ url: 'https://example.com' });
      expect(res.status).to.equal(200);
      expect(fs.existsSync(dbFile)).to.equal(true);
      const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      expect(data).to.be.an('array');
      expect(data).to.have.length(1);
    });
  });

  describe('POST /api/links', () => {
    it('crea un link corto con codigo de 8 caracteres y ruta corta', async () => {
      const res = await request(app)
        .post('/api/links')
        .send({ url: 'https://www.google.com' });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('codigo');
      expect(res.body.codigo).to.match(/^[a-z0-9]{8}$/);
      expect(res.body).to.have.property('corta', `/${res.body.codigo}`);
    });

    it('rechaza URL vacía con 400 JSON', async () => {
      const res = await request(app).post('/api/links').send({ url: '' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('rechaza URL nula/ausente con 400 JSON', async () => {
      const res = await request(app).post('/api/links').send({});
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('rechaza URL solo espacios con 400 JSON', async () => {
      const res = await request(app).post('/api/links').send({ url: '   ' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('rechaza URL sin protocolo http/https con 400 JSON', async () => {
      const res = await request(app).post('/api/links').send({ url: 'ftp://example.com' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('rechaza URL sin protocolo con 400 JSON', async () => {
      const res = await request(app).post('/api/links').send({ url: 'example.com' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('misma URL dos veces genera dos codigos distintos', async () => {
      const url = 'https://example.com/misma';
      const a = await request(app).post('/api/links').send({ url });
      const b = await request(app).post('/api/links').send({ url });
      expect(a.status).to.equal(200);
      expect(b.status).to.equal(200);
      expect(a.body.codigo).to.not.equal(b.body.codigo);
    });

    it('reintenta el generador si el codigo ya existe', async () => {
      const primero = await request(app)
        .post('/api/links')
        .send({ url: 'https://example.com/a' });
      expect(primero.status).to.equal(200);

      let llamadas = 0;
      generarCodigoFn = () => {
        llamadas += 1;
        if (llamadas === 1) return primero.body.codigo;
        return 'zzzzzzzz';
      };

      const segundo = await request(app)
        .post('/api/links')
        .send({ url: 'https://example.com/b' });

      expect(segundo.status).to.equal(200);
      expect(segundo.body.codigo).to.equal('zzzzzzzz');
      expect(llamadas).to.be.at.least(2);
    });

    it('devuelve 409 si agota reintentos por codigo duplicado', async () => {
      const primero = await request(app)
        .post('/api/links')
        .send({ url: 'https://example.com/a' });
      expect(primero.status).to.equal(200);

      generarCodigoFn = () => primero.body.codigo;

      const segundo = await request(app)
        .post('/api/links')
        .send({ url: 'https://example.com/b' });

      expect(segundo.status).to.equal(409);
      expect(segundo.body).to.have.property('error');
    });
  });

  describe('GET /:codigo', () => {
    it('redirige con 302 y header Location a la URL original', async () => {
      const creado = await request(app)
        .post('/api/links')
        .send({ url: 'https://www.google.com' });

      const res = await request(app).get(creado.body.corta).redirects(0);

      expect(res.status).to.equal(302);
      expect(res.headers.location).to.equal('https://www.google.com');
    });

    it('incrementa clicks y los persiste', async () => {
      const creado = await request(app)
        .post('/api/links')
        .send({ url: 'https://example.com/clicks' });

      await request(app).get(creado.body.corta).redirects(0);
      await request(app).get(creado.body.corta).redirects(0);

      const stats = await request(app).get(`/api/links/${creado.body.codigo}/stats`);
      expect(stats.status).to.equal(200);
      expect(stats.body.clicks).to.equal(2);

      const enDisco = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      const link = enDisco.find((l) => l.codigo === creado.body.codigo);
      expect(link.clicks).to.equal(2);
    });

    it('devuelve 404 JSON si el codigo no existe', async () => {
      const res = await request(app).get('/noexiste').redirects(0);
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error');
    });
  });

  describe('GET /api/links/:codigo/stats', () => {
    it('devuelve codigo, url, clicks y creado', async () => {
      const creado = await request(app)
        .post('/api/links')
        .send({ url: 'https://example.com/stats' });

      const res = await request(app).get(`/api/links/${creado.body.codigo}/stats`);

      expect(res.status).to.equal(200);
      expect(res.body).to.include({
        codigo: creado.body.codigo,
        url: 'https://example.com/stats',
        clicks: 0
      });
      expect(res.body).to.have.property('creado');
    });

    it('devuelve 404 JSON si el codigo no existe', async () => {
      const res = await request(app).get('/api/links/abcdefgh/stats');
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error');
    });

    it('no modifica clicks al consultar stats', async () => {
      const creado = await request(app)
        .post('/api/links')
        .send({ url: 'https://example.com/solo-lectura' });

      await request(app).get(`/api/links/${creado.body.codigo}/stats`);
      await request(app).get(`/api/links/${creado.body.codigo}/stats`);

      const res = await request(app).get(`/api/links/${creado.body.codigo}/stats`);
      expect(res.body.clicks).to.equal(0);
    });
  });

  describe('generarCodigo', () => {
    it('genera 8 caracteres alfanumericos', () => {
      const codigo = generarCodigo();
      expect(codigo).to.match(/^[a-z0-9]{8}$/);
    });
  });
});
