# Autenticação e autorização

## Objetivo

Autenticar usuários com e-mail e senha e aplicar os perfis `ADMIN` e `OPERATOR` no backend.

## Requisitos

- **R-01:** autenticar usuário ativo por e-mail e senha.
- **R-02:** emitir JWT de acesso e expor perfil seguro do usuário autenticado.
- **R-03:** garantir os escopos ADMIN/OPERATOR e o vínculo obrigatório do OPERATOR com call center.
- **R-04:** aplicar autenticação e autorização no backend, independentemente da interface.
- **R-05:** proteger segredos, hash de senha e tentativas repetidas de login.
- **R-06:** publicar o contrato HTTP tipado da autenticação no Swagger/OpenAPI.

## Contratos

- `POST /api/auth/login` recebe e-mail e senha e retorna somente `accessToken`.
- `GET /api/auth/me` exige Bearer JWT e retorna o usuário atual.
- Não há cadastro público, refresh token ou logout por revogação.
- A documentação interativa fica em `GET /api/docs`; a especificação OpenAPI fica em `GET /api/docs/openapi.json`.
- O Swagger UI mantém o Bearer token autorizado após a atualização da página enquanto os dados do navegador estiverem preservados.

## Regras

- Token contém apenas `sub`; o usuário atual é carregado do banco em cada chamada autenticada.
- Após o login, o cliente salva o token e consulta `GET /api/auth/me` para obter o perfil atual.
- `OPERATOR` exige call center; `ADMIN` não pode possuir call center.
- Tokens são mantidos em `sessionStorage` pelo frontend.
- DTOs de entrada e de resposta documentam campos, formatos, enum de perfil e respostas de erro sem expor hashes ou segredos.
