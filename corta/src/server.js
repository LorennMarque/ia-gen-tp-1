const express = require('express');
const path = require('path');
const { generarCodigo: generarCodigoDefault } = require('./utils');
const { crearDb } = require('./db');

const MAX_REINTENTOS_CODIGO = 5;

function esUrlValida(url) {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function createApp(options = {}) {
  const generarCodigo = options.generarCodigo || generarCodigoDefault;
  const db = options.db || crearDb({
    databaseUrl: options.databaseUrl,
    nodeEnv: options.nodeEnv,
    dbFile: options.dbFile,
    pool: options.pool
  });

  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  let dbReady = null;
  function inicializarDb() {
    if (!dbReady) dbReady = db.init();
    return dbReady;
  }
  app.locals.db = db;
  app.locals.inicializarDb = inicializarDb;

  function errorJson(res, status, mensaje) {
    return res.status(status).json({ error: mensaje });
  }

  // crear un link corto
  app.post('/api/links', async (req, res) => {
    try {
      const url = req.body && req.body.url;
      if (!esUrlValida(url)) {
        return errorJson(res, 400, 'URL inválida: debe ser http o https');
      }

      await inicializarDb();
      const urlLimpia = url.trim();
      let codigo = null;

      for (let i = 0; i < MAX_REINTENTOS_CODIGO; i++) {
        const candidato = generarCodigo();
        const creado = await db.crearLink({
          codigo: candidato,
          url: urlLimpia,
          clicks: 0,
          creado: new Date().toISOString()
        });
        if (creado) {
          codigo = candidato;
          break;
        }
      }

      if (!codigo) {
        return errorJson(res, 409, 'No se pudo generar un código único');
      }

      return res.json({ codigo, corta: '/' + codigo });
    } catch (err) {
      return errorJson(res, 500, 'Error al guardar el link');
    }
  });

  // estadísticas (antes de /:codigo para no capturar la ruta)
  app.get('/api/links/:codigo/stats', async (req, res) => {
    try {
      await inicializarDb();
      const link = await db.obtenerStats(req.params.codigo);
      if (!link) {
        return errorJson(res, 404, 'Código no existe');
      }
      return res.json(link);
    } catch (err) {
      return errorJson(res, 500, 'Error al leer estadísticas');
    }
  });

  // redirigir al destino
  app.get('/:codigo', async (req, res) => {
    try {
      await inicializarDb();
      const link = await db.incrementarClicks(req.params.codigo);
      if (!link) {
        return errorJson(res, 404, 'Código no existe');
      }
      return res.redirect(302, link.url);
    } catch (err) {
      return errorJson(res, 500, 'Error al redirigir');
    }
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.locals.inicializarDb()
    .then(() => {
      app.listen(port, () => {
        console.log(`Corta escuchando en http://localhost:${port}`);
      });
    })
    .catch((err) => {
      console.error(`No se pudo inicializar la base de datos: ${err.message}`);
      process.exitCode = 1;
    });
}

module.exports = { createApp, app };
