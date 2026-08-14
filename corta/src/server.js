const express = require('express');
const fs = require('fs');
const path = require('path');
const { generarCodigo: generarCodigoDefault } = require('./utils');

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
  const DB_FILE = options.dbFile || path.join(__dirname, '../data/links.json');
  const generarCodigo = options.generarCodigo || generarCodigoDefault;

  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  let cola = Promise.resolve();

  function encolar(fn) {
    const resultado = cola.then(fn, fn);
    cola = resultado.catch(() => {});
    return resultado;
  }

  function asegurarDb() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      escribirAtomico(DB_FILE, '[]');
    }
  }

  function escribirAtomico(filePath, contenido) {
    const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, contenido);
    fs.renameSync(tmp, filePath);
  }

  function leerLinks() {
    asegurarDb();
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }

  function guardarLinks(links) {
    asegurarDb();
    escribirAtomico(DB_FILE, JSON.stringify(links, null, 2));
  }

  function errorJson(res, status, mensaje) {
    return res.status(status).json({ error: mensaje });
  }

  // crear un link corto
  app.post('/api/links', (req, res) => {
    encolar(() => {
      try {
        const url = req.body && req.body.url;
        if (!esUrlValida(url)) {
          return errorJson(res, 400, 'URL inválida: debe ser http o https');
        }

        const urlLimpia = url.trim();
        const links = leerLinks();
        let codigo = null;

        for (let i = 0; i < MAX_REINTENTOS_CODIGO; i++) {
          const candidato = generarCodigo();
          if (!links.some((l) => l.codigo === candidato)) {
            codigo = candidato;
            break;
          }
        }

        if (!codigo) {
          return errorJson(res, 409, 'No se pudo generar un código único');
        }

        const nuevo = {
          codigo,
          url: urlLimpia,
          clicks: 0,
          creado: new Date().toISOString()
        };
        links.push(nuevo);
        guardarLinks(links);
        return res.json({ codigo, corta: '/' + codigo });
      } catch (err) {
        return errorJson(res, 500, 'Error al guardar el link');
      }
    });
  });

  // estadísticas (antes de /:codigo para no capturar la ruta)
  app.get('/api/links/:codigo/stats', (req, res) => {
    encolar(() => {
      try {
        const links = leerLinks();
        const link = links.find((l) => l.codigo === req.params.codigo);
        if (!link) {
          return errorJson(res, 404, 'Código no existe');
        }
        return res.json({
          codigo: link.codigo,
          url: link.url,
          clicks: link.clicks,
          creado: link.creado
        });
      } catch (err) {
        return errorJson(res, 500, 'Error al leer estadísticas');
      }
    });
  });

  // redirigir al destino
  app.get('/:codigo', (req, res) => {
    encolar(() => {
      try {
        const links = leerLinks();
        const link = links.find((l) => l.codigo === req.params.codigo);
        if (!link) {
          return errorJson(res, 404, 'Código no existe');
        }
        link.clicks = link.clicks + 1;
        guardarLinks(links);
        return res.redirect(302, link.url);
      } catch (err) {
        return errorJson(res, 500, 'Error al redirigir');
      }
    });
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Corta escuchando en http://localhost:${port}`);
  });
}

module.exports = { createApp, app };
