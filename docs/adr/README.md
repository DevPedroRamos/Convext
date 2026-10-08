# Architecture Decision Records

Registrar um ADR quando a decisão for arquitetural e precisar ser recuperada depois: troca de boundary, persistência, auth, integração externa ou rejeição load-bearing de um candidato de design.

Não registrar decisão efêmera ("não vale a pena agora") nem o que já está óbvio no código.

Specs de feature ficam em `docs/specs/`. O glossário do domínio, se existir, fica na raiz como `GLOSSARY.md` (convenção das skills Matt Pocock).

## Template

Nome do arquivo: `NNNN-titulo-curto.md` (número sequencial de 4 dígitos).

```md
# Título

Data: YYYY-MM-DD
Status: accepted | superseded | rejected

## Contexto

O problema e as restrições.

## Decisão

O que foi escolhido.

## Consequências

O que passa a ser mais fácil, mais difícil ou fora de escopo.
```
