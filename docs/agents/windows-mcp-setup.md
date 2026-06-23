# Windows MCP setup

`windows-mcp` is intended to run on Windows hosts. Do not try to install or
serve it from the Linux agent container: the package depends on `pywin32`, whose
wheels are published for Windows platforms only.

## Recommended Windows setup

Install the server from a Windows shell:

```sh
windows-mcp install --transport sse --host 127.0.0.1 --port 8000
```

Use `127.0.0.1` when the MCP client runs on the same Windows machine. This keeps
the service bound to the local host instead of exposing it on the wider network.

## Manual serve commands

For a foreground process during local debugging, use one of:

```sh
windows-mcp serve
windows-mcp serve --transport sse --host localhost --port 8000
windows-mcp serve --transport streamable-http --host localhost --port 8000
```

Prefer the explicit SSE command when documenting or sharing setup steps, because
it makes the transport and bind address unambiguous.

## Expected failure in Linux containers

Running `uvx windows-mcp ...` from a Linux container is expected to fail during
dependency resolution with a `pywin32` platform mismatch. Treat that as an
environment limitation, not as a repository setup failure.
