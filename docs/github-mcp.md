# Instalar GitHub MCP en Claude Code y Codex

Conecta el agente al servidor MCP remoto de GitHub para operar sobre repos, issues y pull requests.

## 1 · Crear el token

Andá a https://github.com/settings/personal-access-tokens y creá un **fine-grained token** con acceso a los repos necesarios.

| Necesitás | Permiso |
| --- | --- |
| Código, branches y commits | `Contents: Read` |
| Issues | `Issues: Read and write` |
| Pull requests | `Pull requests: Read and write` |

Copiá el token: GitHub lo muestra una sola vez.

## 2 · Configurar Claude Code

```bash
claude mcp add --transport http --scope user github https://api.githubcopilot.com/mcp/ \
  --header "Authorization: Bearer TU_TOKEN_ACA"
```

En PowerShell, usá backtick (`` ` ``) en lugar de `\` para continuar la línea. En `cmd.exe`, escribí todo en una sola línea.

`--scope user` deja el servidor disponible en todos los proyectos. El token queda guardado en texto plano dentro de la configuración de usuario de Claude Code.

## 3 · Configurar Codex

Definí el token en el entorno desde el que iniciás Codex.

macOS o Linux:

```bash
export GITHUB_PAT_TOKEN="TU_TOKEN_ACA"
```

PowerShell:

```powershell
$env:GITHUB_PAT_TOKEN = "TU_TOKEN_ACA"
```

Agregá el servidor:

```bash
codex mcp add github --url https://api.githubcopilot.com/mcp/ \
  --bearer-token-env-var GITHUB_PAT_TOKEN
```

Codex guarda el nombre `GITHUB_PAT_TOKEN`, no el valor. La variable debe existir cada vez que se inicia Codex y nunca debe agregarse al repositorio.

## 4 · Verificar

Claude Code:

```bash
claude mcp get github
claude mcp list
```

Codex:

```bash
codex mcp get github
```

Reiniciá el cliente después de configurarlo. En Codex también podés usar `/mcp`. Prueba de humo para ambos:

```text
Con GitHub MCP, decime quién soy y listá mis últimos 5 repos.
```

## Cambiar el token

Claude Code requiere borrar y volver a agregar la entrada:

```bash
claude mcp remove github --scope user
```

En Codex, actualizá `GITHUB_PAT_TOKEN` en el entorno y reiniciá el cliente.

## Si algo falla

| Síntoma | Solución |
| --- | --- |
| `HTTP 400` por header inválido | Revisá que el token no esté vacío ni sea el placeholder |
| `HTTP 401` | Generá un token nuevo |
| `HTTP 403` en una operación | Agregá al token el permiso que falta |
| Codex configura la URL pero responde 401 | Confirmá `--bearer-token-env-var` y que la variable exista al iniciar |
| No aparecen tools de GitHub | Reiniciá el cliente y revisá su comando de verificación |

## Referencias

- [GitHub MCP para Claude Code](https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-claude.md)
- [GitHub MCP para Codex](https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-codex.md)
- [Claude Code — MCP](https://code.claude.com/docs/en/mcp)
- [OpenAI Codex — MCP](https://developers.openai.com/codex/mcp)
