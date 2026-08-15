const fs = require('fs');
const path = require('path');

function normalizarLink(link) {
  if (!link) return null;
  const creado = link.creado instanceof Date
    ? link.creado.toISOString()
    : link.creado;
  return {
    codigo: link.codigo,
    url: link.url,
    clicks: Number(link.clicks),
    creado
  };
}

class JsonDb {
  constructor({ dbFile }) {
    this.dbFile = dbFile;
    this.cola = Promise.resolve();
  }

  encolar(fn) {
    const resultado = this.cola.then(fn, fn);
    this.cola = resultado.catch(() => {});
    return resultado;
  }

  async init() {
    const dir = path.dirname(this.dbFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.dbFile)) {
      this.escribirAtomico('[]');
    }
  }

  escribirAtomico(contenido) {
    const tmp = `${this.dbFile}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, contenido);
    fs.renameSync(tmp, this.dbFile);
  }

  leerLinks() {
    return JSON.parse(fs.readFileSync(this.dbFile, 'utf8'));
  }

  guardarLinks(links) {
    this.escribirAtomico(JSON.stringify(links, null, 2));
  }

  async crearLink(link) {
    return this.encolar(() => {
      const links = this.leerLinks();
      if (links.some((item) => item.codigo === link.codigo)) {
        return false;
      }
      links.push(normalizarLink(link));
      this.guardarLinks(links);
      return true;
    });
  }

  async obtenerStats(codigo) {
    return this.encolar(() => {
      const links = this.leerLinks();
      return normalizarLink(links.find((item) => item.codigo === codigo));
    });
  }

  async incrementarClicks(codigo) {
    return this.encolar(() => {
      const links = this.leerLinks();
      const link = links.find((item) => item.codigo === codigo);
      if (!link) return null;
      link.clicks += 1;
      this.guardarLinks(links);
      return normalizarLink(link);
    });
  }

  async cerrar() {}
}

class PostgresDb {
  constructor({ databaseUrl, pool }) {
    if (pool) {
      this.pool = pool;
      return;
    }
    const { Pool } = require('pg');
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS links (
        codigo VARCHAR(8) PRIMARY KEY,
        url TEXT NOT NULL,
        clicks INTEGER NOT NULL DEFAULT 0,
        creado TIMESTAMPTZ NOT NULL
      )
    `);
  }

  async crearLink(link) {
    try {
      await this.pool.query(
        `INSERT INTO links (codigo, url, clicks, creado)
         VALUES ($1, $2, $3, $4)`,
        [link.codigo, link.url, link.clicks, link.creado]
      );
      return true;
    } catch (err) {
      if (err.code === '23505') return false;
      throw err;
    }
  }

  async obtenerStats(codigo) {
    const resultado = await this.pool.query(
      'SELECT codigo, url, clicks, creado FROM links WHERE codigo = $1',
      [codigo]
    );
    return normalizarLink(resultado.rows[0]);
  }

  async incrementarClicks(codigo) {
    const resultado = await this.pool.query(
      `UPDATE links
       SET clicks = clicks + 1
       WHERE codigo = $1
       RETURNING codigo, url, clicks, creado`,
      [codigo]
    );
    return normalizarLink(resultado.rows[0]);
  }

  async cerrar() {
    await this.pool.end();
  }
}

function crearDb(options = {}) {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL ?? '';
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV ?? '';

  if (databaseUrl.trim()) {
    return new PostgresDb({ databaseUrl, pool: options.pool });
  }
  if (nodeEnv === 'production') {
    throw new Error('DATABASE_URL es obligatoria en producción');
  }
  return new JsonDb({
    dbFile: options.dbFile || path.join(__dirname, '../data/links.json')
  });
}

module.exports = { crearDb, JsonDb, PostgresDb };
