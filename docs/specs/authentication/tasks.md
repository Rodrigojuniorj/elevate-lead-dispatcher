# Tarefas — Autenticação e autorização

## 1. Persistência e dados de acesso

- [x] **1.1 Modelar `User`, `CallCenter` e `UserRole` no Prisma.**
  - Dependência: nenhuma.
  - Resultado: tabelas e colunas em inglês, e-mail único e timestamps.
  - Requisitos: R-01, R-03.
- [x] **1.2 Versionar a migration com as constraints de role e call center.**
  - Dependência: 1.1.
  - Resultado: `OPERATOR` exige call center; `ADMIN` não pode possuir call center.
  - Requisitos: R-03.
- [x] **1.3 Criar seed idempotente para o ADMIN inicial.**
  - Dependência: 1.1.
  - Resultado: orquestrador em `prisma/seed.mjs`, seed de ADMIN isolado em `prisma/seeds/` e hash Argon2id.
  - Requisitos: R-01, R-05.
- [x] **1.4 Criar seed idempotente para o call center inicial.**
  - Dependência: 1.1.
  - Resultado: `Call Center A`, `Call Center B` e `Call Center C` são atualizados ou criados pelos respectivos códigos únicos.
  - Requisitos: R-03.

## 2. API de autenticação

- [x] **2.1 Implementar validação global e DTO de login.**
  - Dependência: 1.1.
  - Resultado: payload inválido é rejeitado antes da regra de negócio.
  - Requisitos: R-01, R-05.
- [x] **2.2 Implementar login com JWT de curta duração.**
  - Dependência: 2.1.
  - Resultado: `POST /api/auth/login` retorna somente o token de acesso.
  - Requisitos: R-01, R-02.
- [x] **2.3 Implementar usuário autenticado e endpoint de perfil.**
  - Dependência: 2.2.
  - Resultado: `GET /api/auth/me` carrega usuário ativo pelo `sub` do JWT.
  - Requisitos: R-02, R-04.

## 3. Autorização reutilizável

- [x] **3.1 Criar decorators e guards compartilhados.**
  - Dependência: 2.3.
  - Resultado: `@Public`, `@Roles`, `JwtAuthGuard` e `RolesGuard` ficam em `src/common/`.
  - Requisitos: R-03, R-04.
- [x] **3.2 Criar serviço de escopo por call center.**
  - Dependência: 3.1.
  - Resultado: ADMIN acessa qualquer call center; OPERATOR somente o próprio.
  - Requisitos: R-03.

## 4. Interface e sessão da aba

- [x] **4.1 Separar cliente HTTP, APIs de auth, contexto e tipos.**
  - Dependência: 2.3.
  - Resultado: token fica em `sessionStorage`; comunicação HTTP não fica em páginas.
  - Requisitos: R-02, R-04.
- [x] **4.2 Criar páginas de login e dashboard protegido.**
  - Dependência: 4.1.
  - Resultado: login, restauração da sessão e saída local funcionam no shell inicial.
  - Requisitos: R-01, R-02.

## 5. Verificação

- [x] **5.1 Criar e executar testes unitários de autenticação e autorização.**
  - Dependência: 2.2 e 3.2.
  - Resultado: login, roles, guard público e escopo por call center são cobertos.
  - Requisitos: R-01 a R-05.
- [ ] **5.2 Criar e2e autenticado com PostgreSQL isolado.**
  - Dependência: ambiente de banco de teste definido.
  - Resultado: fluxos HTTP reais de login e autorização cobertos.
  - Requisitos: R-01 a R-04.

## 6. Contrato OpenAPI

- [x] **6.1 Configurar Swagger e publicar a especificação OpenAPI.**
  - Dependência: 2.3.
  - Resultado: documentação interativa em `/api/docs` e contrato JSON em `/api/docs/openapi.json`.
  - Requisitos: R-06.
- [x] **6.2 Tipar DTOs de entrada, saída e erro da autenticação.**
  - Dependência: 6.1.
  - Resultado: login, perfil atual, enum `UserRole`, erros e Bearer JWT possuem schemas explícitos.
  - Requisitos: R-01, R-02, R-05, R-06.
