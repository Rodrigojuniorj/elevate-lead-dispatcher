# Tarefas — Fundação

## 1. Estrutura inicial

- [x] **1.1 Criar frontend React/Vite e backend NestJS.**
  - Dependência: nenhuma.
  - Resultado: processos independentes para interface e API.
- [x] **1.2 Criar contrato de saúde e CORS local.**
  - Dependência: 1.1.
  - Resultado: `GET /api/health` valida conectividade inicial.

## 2. Qualidade e configuração

- [x] **2.1 Adicionar arquivos de exemplo e regras de ignore.**
  - Dependência: 1.1.
  - Resultado: segredos, dependências e builds não são versionados.
- [x] **2.2 Validar build e testes de saúde.**
  - Dependência: 1.2.
  - Resultado: fundação executável para as próximas features.
