const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { newDb } = require('pg-mem');
const { crearDb, JsonDb, PostgresDb } = require('../src/db');

const LINK = {
  codigo: 'abc123xy',
  url: 'https://example.com/original',
  clicks: 0,
  creado: '2026-08-15T12:00:00.000Z'
};

function crearPoolEnMemoria() {
  const memoria = newDb();
  const pg = memoria.adapters.createPg();
  return new pg.Pool();
}

function probarContrato(nombre, crearContexto) {
  describe(nombre, () => {
    let contexto;
    let db;

    beforeEach(async () => {
      contexto = crearContexto();
      db = contexto.db;
      await db.init();
    });

    afterEach(async () => {
      await db.cerrar();
      contexto.limpiar();
    });

    it('crea un link y devuelve sus estadisticas', async () => {
      expect(await db.crearLink(LINK)).to.equal(true);

      const guardado = await db.obtenerStats(LINK.codigo);

      expect(guardado).to.deep.equal(LINK);
    });

    it('rechaza un codigo duplicado sin reemplazar el link original', async () => {
      await db.crearLink(LINK);

      const creado = await db.crearLink({
        ...LINK,
        url: 'https://example.com/otra'
      });

      expect(creado).to.equal(false);
      expect(await db.obtenerStats(LINK.codigo)).to.deep.equal(LINK);
    });

    it('incrementa clicks concurrentes sin perder actualizaciones', async () => {
      await db.crearLink(LINK);

      await Promise.all(
        Array.from({ length: 20 }, () => db.incrementarClicks(LINK.codigo))
      );

      const guardado = await db.obtenerStats(LINK.codigo);
      expect(guardado.clicks).to.equal(20);
    });

    it('devuelve null para un codigo inexistente', async () => {
      expect(await db.obtenerStats('noexiste')).to.equal(null);
      expect(await db.incrementarClicks('noexiste')).to.equal(null);
    });
  });
}

describe('seleccion de almacenamiento', () => {
  it('usa JSON local sin DATABASE_URL fuera de produccion', () => {
    const db = crearDb({
      databaseUrl: '',
      nodeEnv: 'development',
      dbFile: '/tmp/corta-local.json'
    });

    expect(db).to.be.instanceOf(JsonDb);
  });

  it('usa PostgreSQL cuando existe DATABASE_URL', async () => {
    const pool = crearPoolEnMemoria();
    const db = crearDb({
      databaseUrl: 'postgres://usuario:clave@db/corta',
      nodeEnv: 'production',
      pool
    });

    expect(db).to.be.instanceOf(PostgresDb);
    await db.cerrar();
  });

  it('rechaza produccion sin DATABASE_URL', () => {
    expect(() => crearDb({ databaseUrl: '', nodeEnv: 'production' }))
      .to.throw('DATABASE_URL');
  });
});

probarContrato('JsonDb', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'corta-json-db-'));
  return {
    db: new JsonDb({ dbFile: path.join(tempDir, 'data', 'links.json') }),
    limpiar: () => fs.rmSync(tempDir, { recursive: true, force: true })
  };
});

probarContrato('PostgresDb', () => ({
  db: new PostgresDb({ pool: crearPoolEnMemoria() }),
  limpiar: () => {}
}));
