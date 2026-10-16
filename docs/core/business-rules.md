# Regras de negócio

## Usuários e acesso

- `ADMIN` acessa recursos administrativos, métricas e qualquer call center.
- `OPERATOR` deve estar associado a exatamente um `CallCenter` e só pode consultar ou atualizar leads daquele call center.
- Usuários inativos não podem autenticar nem acessar recursos autenticados.
- A autorização é aplicada no backend. A interface apenas reflete as permissões retornadas pela API.

## Dados mínimos

- E-mail de usuário é normalizado para minúsculas e único.
- Senhas são armazenadas somente como hash Argon2id.
- Call centers não são criados automaticamente; sua configuração pertence a uma feature posterior.
