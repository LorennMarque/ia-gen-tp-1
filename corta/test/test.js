const { expect } = require('chai');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp } = require('../src/server');
const { generarCodigo } = require('../src/utils');

describe('Corta', () => {
  let tempDir;
  let dbFile;
  let app;
  let generarCodigoFn;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'corta-test-'));
    dbFile = path.join(tempDir, 'data', 'links.json');
    generarCodigoFn = generarCodigo;
    app = createApp({
      dbFile,
      generarCodigo: (...args) => generarCodigoFn(...args)
    });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('persistencia / init', () => {
    function crearAppConFalloDeIo() {
      const archivoEnLugarDeDirectorio = path.join(tempDir, 'ruta-bloqueada');
      fs.writeFileSync(archivoEnLugarDeDirectorio, 'no es un directorio');
      return createApp({
        dbFile: path.join(archivoEnLugarDeDirectorio, 'links.json'),
        generarCodigo
      });
    }

    it('crea data/ y links.json con [] si no existen', async () => {
      const dbDir = path.dirname(dbFile);
      expect(fs.existsSync(dbDir)).to.equal(false);
      expect(fs.existsSync(dbFile)).to.equal(false);

      const res = await request(app).get('/noexiste').redirects(0);

      expect(res.status).to.equal(404);
      expect(fs.existsSync(dbDir)).to.equal(true);
      expect(fs.existsSync(dbFile)).to.equal(true);
      const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      expect(data).to.deep.equal([]);
    });

    it('POST /api/links devuelve 500 JSON ante un fallo de almacenamiento', async () => {
      const appConFallo = crearAppConFalloDeIo();
      const res = await request(appConFallo)
        .post('/api/links')
        .send({ url: 'https://example.com' });

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property('error');
    });

    it('GET /:codigo devuelve 500 JSON ante un fallo de almacenamiento', async () => {
      const appConFallo = crearAppConFalloDeIo();
      const res = await request(appConFallo).get('/abcdefgh').redirects(0);

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property('error');
    });

    it('GET /api/links/:codigo/stats devuelve 500 JSON ante un fallo de almacenamiento', async () => {
      const appConFallo = crearAppConFalloDeIo();
      const res = await request(appConFallo).get('/api/links/abcdefgh/stats');

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property('error');
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

    it('POST /api/links concurrentes no pierden links', async () => {
      let secuencia = 0;
      generarCodigoFn = () => {
        const codigo = secuencia.toString(36).padStart(8, '0');
        secuencia += 1;
        return codigo;
      };

      const cantidad = 20;
      const respuestas = await Promise.all(
        Array.from({ length: cantidad }, (_, indice) => (
          request(app)
            .post('/api/links')
            .send({ url: `https://example.com/concurrente/${indice}` })
        ))
      );

      expect(respuestas.every((res) => res.status === 200)).to.equal(true);
      const links = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      expect(links).to.have.length(cantidad);
      expect(new Set(links.map((link) => link.codigo)).size).to.equal(cantidad);
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

    it('GET /:codigo concurrentes no pierden incrementos de clicks', async () => {
      const creado = await request(app)
        .post('/api/links')
        .send({ url: 'https://example.com/clicks-concurrentes' });

      const cantidad = 20;
      const respuestas = await Promise.all(
        Array.from({ length: cantidad }, () => (
          request(app).get(creado.body.corta).redirects(0)
        ))
      );

      expect(respuestas.every((res) => res.status === 302)).to.equal(true);
      const links = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      const link = links.find((item) => item.codigo === creado.body.codigo);
      expect(link.clicks).to.equal(cantidad);
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

    it('devuelve creado como timestamp ISO8601 valido', async () => {
      const creado = await request(app)
        .post('/api/links')
        .send({ url: 'https://example.com/timestamp' });

      const res = await request(app).get(`/api/links/${creado.body.codigo}/stats`);
      const timestamp = res.body.creado;

      expect(res.status).to.equal(200);
      expect(timestamp).to.be.a('string');
      expect(timestamp).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(timestamp).toISOString()).to.equal(timestamp);
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
