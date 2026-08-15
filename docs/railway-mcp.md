# Instalar Railway MCP en Claude Code y Codex

Conecta ambos agentes con Railway para crear proyectos, servicios, bases de datos y deploys. Esta guía usa el servidor MCP **local**, autenticado mediante Railway CLI.

## 1 · Instalar Railway CLI

macOS con Homebrew:

```bash
brew install railway
```

Alternativa para macOS, Linux o Windows:

```bash
npm install -g @railway/cli
```

Verificá la instalación:

```bash
railway --version
```

## 2 · Iniciar sesión

```bash
railway login
railway whoami
```

Si la terminal no puede abrir un navegador:

```bash
railway login --browserless
```

## 3 · Instalar el MCP local

Para Claude Code y Codex juntos:

```bash
railway mcp install --agent claude-code --agent codex --local
```

Si usás uno solo, dejá únicamente su `--agent`:

```bash
railway mcp install --agent claude-code --local
railway mcp install --agent codex --local
```

`--local` configura `railway mcp` como servidor STDIO y evita instalar el proxy remoto que algunas versiones de Railway CLI usan por defecto.

## 4 · Verificar

Claude Code:

```bash
claude mcp get railway
```

Codex:

```bash
codex mcp get railway
```

En ambos casos, la configuración debe mostrar:

```text
command: railway
args: mcp
```

Reiniciá los clientes para cargar las tools. Prueba de humo:

```text
Con Railway MCP, decime quién soy y listá mis proyectos.
```

## Si algo falla

| Síntoma | Solución |
| --- | --- |
| `railway: command not found` | Instalá la CLI y reiniciá la terminal |
| Railway informa que no estás autenticado | Ejecutá `railway login` nuevamente |
| La configuración muestra `args: mcp proxy` | Repetí la instalación con `--local` |
| No aparecen tools de Railway | Reiniciá el cliente después de instalar el MCP |

## Referencias

- [Railway CLI](https://docs.railway.com/cli)
- [Railway MCP CLI](https://docs.railway.com/cli/mcp)
- [Claude Code — MCP](https://code.claude.com/docs/en/mcp)
- [OpenAI Codex — MCP](https://developers.openai.com/codex/mcp)
