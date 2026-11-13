FROM node:26.13.0-bookworm-slim AS compiler
RUN apt-get update && apt-get install -y --no-install-recommends clang zlib1g-dev ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@12.5.1
WORKDIR /build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts && pnpm rebuild scriptc
COPY src/ ./src/
COPY scripts/build/ ./scripts/build/
COPY scripts/rules/ ./scripts/rules/
COPY docs/rules.md ./docs/rules.md
RUN pnpm run build:native && cp bin/native/legibility /usr/local/bin/legibility

FROM node:26.13.0-bookworm-slim AS typescript
RUN apt-get update && apt-get install -y --no-install-recommends git nano && rm -rf /var/lib/apt/lists/*
COPY --from=compiler /usr/local/bin/legibility /usr/local/bin/legibility
WORKDIR /workspace
COPY tests/e2e/fixtures/typescript/ ./
COPY tests/e2e/index.ts /proof/tests/e2e/index.ts
COPY tests/e2e/fixtures/typescript/ /proof/tests/e2e/fixtures/typescript/
RUN npm install && git init --quiet
ENV TERM=xterm-256color
CMD ["sleep", "infinity"]

FROM golang:1.25-bookworm AS go
RUN apt-get update && apt-get install -y --no-install-recommends nano && rm -rf /var/lib/apt/lists/*
RUN GOTOOLCHAIN=auto go install github.com/yowainwright/go-lint-legibility/cmd/go-lint-legibility@v0.4.1
COPY --from=compiler /usr/local/bin/legibility /usr/local/bin/legibility
WORKDIR /workspace
COPY tests/e2e/fixtures/go/ ./
RUN git init --quiet
ENV TERM=xterm-256color
CMD ["sleep", "infinity"]

FROM rust:1-slim-bookworm AS python-wheel
RUN apt-get update && apt-get install -y --no-install-recommends python3-dev python3-venv && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/build-env
RUN /opt/build-env/bin/pip wheel --no-deps --wheel-dir /wheels ruff-legibility==0.4.0

FROM python:3.12-slim-bookworm AS python
RUN apt-get update && apt-get install -y --no-install-recommends git nano && rm -rf /var/lib/apt/lists/*
COPY --from=python-wheel /wheels /wheels
RUN pip install --no-cache-dir ruff /wheels/*.whl
RUN ruff-legibility --version
COPY --from=compiler /usr/local/bin/legibility /usr/local/bin/legibility
WORKDIR /workspace
COPY tests/e2e/fixtures/python/ ./
RUN git init --quiet
ENV TERM=xterm-256color
CMD ["sleep", "infinity"]
