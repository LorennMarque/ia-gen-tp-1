const CARACTERES = 'abcdefghijklmnopqrstuvwxyz0123456789';

function generarCodigo() {
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += CARACTERES[Math.floor(Math.random() * CARACTERES.length)];
  }
  return codigo;
}

module.exports = { generarCodigo };
