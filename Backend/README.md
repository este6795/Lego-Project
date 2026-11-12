# Backend

## Overview

The backend is an Express server that uses Ollama's `qwen3:8b` model to turn
LEGO building prompts into structured specifications. It supports two parsing
modes:

- `strict` includes only components explicitly requested or unambiguously
  implied by the prompt.
- `suggestions` may add up to five useful component types and marks them as
  suggested in the result.

The server validates the model response, normalizes common component names and
parent IDs, checks component hierarchies, and reports conflicts between
requested and forbidden colors.

## Requirements

- Node.js and npm
- Ollama installed and running, with the `qwen3:8b` model available
- Postman or another HTTP client/extension that can send JSON `POST` requests

Download the model with:

```bash
ollama pull qwen3:8b
```

## Start the server

In a terminal, change to the `Backend` directory, install the dependencies,
and start the development server:

```bash
cd Backend
npm install
npm run dev
```

The server listens at `http://localhost:3000`. To check that it is online,
visit <http://localhost:3000/>. The health response includes the server status
and model name.

## Parse a LEGO prompt

Send a `POST` request to:

```text
http://localhost:3000/api/parse
```

Set the request's content type to `application/json` and use this JSON body:

```json
{
  "text": "[Enter Prompt here]",
  "mode": "[Either suggestions or strict]"
}
```

`text` must contain a non-empty prompt of no more than 2,000 characters.
`mode` must be `suggestions` or `strict`; if omitted, it defaults to `strict`.

On success, the server returns JSON containing `success`, `model`, `mode`, and
`data`. The `data` object contains the parsed object type, colors, dimensions,
components, constraints, conflicts, and highlighted prompt phrases. Invalid
input returns an appropriate client error; parsing or model failures return an
error response. Make sure Ollama is running and `qwen3:8b` is available if a
request cannot be processed.
