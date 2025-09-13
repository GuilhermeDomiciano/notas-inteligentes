This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Setup:

```bash
pnpm install
pnpm playwright:install # instala navegador para PDF
pnpm prisma:migrate     # cria banco SQLite em ./data/dev.db
pnpm db:seed            # popula com turma + alunos + atividades
pnpm dev                # inicia em http://localhost:3000
```

Rotas principais:
- `/classes` — lista/cria turmas
- `/classes/:id/tabs/students` — alunos (CRUD, soft delete)
- `/classes/:id/tabs/activities` — atividades (CRUD)
- `/classes/:id/tabs/grades` — lançamentos (edição inline)
- `/classes/:id/tabs/report` — relatório com filtros + calculadoras
- `/api/report/pdf?classId=:id&until=YYYY-MM-DD&hideUndefined=1` — exporta PDF

Notas:
- Calculadoras: necessário na G2 e, se MF<6, necessário na PF.
- Regras: MF=(G1+2*G2)/3; MR=(MF+2*PF)/3; aprovação ≥6.
- Semáforo: vermelho <5; amarelo 5–5.9; verde ≥6.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
