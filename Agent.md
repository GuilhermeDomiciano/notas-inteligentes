# Codex – Contexto do Projeto

Objetivo: manter e evoluir um mini-sistema acadêmico demonstrativo para o seminário "Tecnologias para Geração de Relatórios Inteligentes".  
Stack: Next.js (App Router, TS), Server Actions, Prisma (SQLite), Tailwind + shadcn/ui, Zod, RHF, Playwright (PDF).

## Domínio e Regras

- Turmas (Class), Alunos (Student), Atividades (Activity) e Lançamentos (StudentActivityGrade).
- Buckets: G1, G2, FINAL (Prova Final).
- Atividades têm `weight` (idealmente somam 10 por bucket).
- Nota do aluno por atividade é de 0..weight.
- MF = (G1 + 2*G2)/3; MR (com PF) = (MF + 2*PF)/3; aprovado com ≥ 6.0.
- Calculadoras: 
  - neededG2ForApproval(G1) = clamp((3*6 - G1)/2, 0, 10)
  - neededPFForApproval(MF) = clamp((3*6 - MF)/2, 0, 10)
- Semáforo: vermelho <5, amarelo 5–5.9, verde ≥6.
- Histórico (GradeAudit) em toda mudança de `points`.
- Soft delete de aluno (`deletedAt`).

## Pastas Importantes

- `src/app/(admin)/classes/[id]/tabs/...` – telas de Alunos, Atividades, Lançamentos e Relatório.
- `src/app/(admin)/classes/[id]/actions.ts` – Server Actions para CRUD e notas.
- `src/lib/grades.ts` – helpers de cálculo.
- `src/lib/pdf.ts` + `src/app/api/report/pdf/route.ts` – exportar PDF.
- `prisma/schema.prisma` – modelo de dados.
- `prisma/seed.ts` – povoamento com 30 alunos e várias atividades.

## Tarefas abertas (prioridades)

1) **UI de Lançamentos**:  
   - Edição inline por célula (Aluno × Atividade).  
   - Ao salvar, chamar `upsertGrade` com audit.  
   - Mostrar mini-histórico (últimas 3 alterações) num Drawer.

2) **Relatório**:  
   - Filtros: bucket (G1/G2/ALL), até data, ocultar não definidas, ordenar por média.  
   - Tabela semaforizada e gráfico simples (Recharts opcional).  
   - `getNarrative(stats)` com texto fixo.

3) **PDF**:  
   - Página `report/print` estilizada sem botões.  
   - Rota `/api/report/pdf` funcional (Playwright).  
   - Testar com filtros.

4) **Calculadoras**:  
   - Em cada linha de aluno, exibir “Necessário na G2” e, se MF < 6, “Necessário na PF”.

5) **Área do aluno (futuro)**  
   - Criar rotas `src/app/student/[academicNo]/page.tsx` com placeholder.  
   - No futuro, adicionar autenticação e escopo de dados.

6) **Qualidade**  
   - Validações com Zod nos forms.  
   - Tratar valores `points` fora do intervalo (0..weight).  
   - Recalcular médias “até data” (filtrar por `activity.dueAt` <= filtro).

## Convenções

- Sempre usar Server Actions nas telas administrativas.
- Revalidar com `revalidatePath` após mutações.
- Não expor dados soft-deleted por padrão.
- Mensagens de commit curtas e descritivas (ex: `feat(grades): add audit trail`).

## Como rodar
- pnpm install
- pnpm prisma:migrate
- pnpm db:seed
- pnpm dev


## Dicas de UI (shadcn)

- Use `Card`, `Table`, `Tabs`, `Badge`, `Dialog`, `Drawer`, `DropdownMenu`, `Sonner`.
- Layout: `grid grid-cols-12 gap-6`, cards `rounded-2xl shadow-sm p-6`.

prompt importante:
1) Objetivo & fluxo principal

Qual é o objetivo do app na demo? (ex.: cadastrar notas/frequência e gerar relatório narrativo + gráfico)

Fluxo mínimo que você quer mostrar ao vivo? (ex.: criar turma → adicionar alunos → lançar G1/G2/frequência → ver relatório)

2) Modelo de dados

Haverá turmas/disciplinas ou é tudo em uma única turma?

Campos do Aluno: nome, e-mail (opcional?), matrícula (opcional?), observações?

Campos de Avaliação: G1, G2 (0–10?), média final (cálculo?), frequência (%)?

Regras de cálculo: média = (G1+G2)/2? arredondamento? mínimo para aprovação? frequência mínima?

Precisamos de histórico de lançamentos (auditoria) ou só o último valor?

3) Acesso & papéis

Terá login? Se sim, quem loga (professor apenas, ou também aluno)?

Precisamos de papéis (admin/professor) ou basta um usuário único para demo?

4) Funcionalidades CRUD

O que precisa de CRUD completo? (Alunos, Turmas, Notas/Frequência)

Deletar aluno com notas já lançadas: permitido? (se sim, soft delete?)

Importação CSV dos alunos é desejada ou manual já basta?

5) Relatórios & visualizações

Quais saídas você quer demonstrar?

( ) Tabela com ordenação/filtros

( ) Gráfico (barras da média, pizza por faixas de nota, etc.)

( ) Narrativa automática (IA opcional ou regra fixa)

( ) Exportar PDF (server-side via Puppeteer/Playwright)

Critério “aluno em risco”: qual regra? (ex.: média < 6 ou frequência < 75%)

6) UI/UX

Layout simples com shadcn/ui + Tailwind?

Páginas necessárias: /login (se tiver), /alunos, /lancamentos, /relatorio. Falta alguma?

Idioma: PT-BR apenas?

7) Stack & arquitetura (Next 14/15 – App Router)

Você prefere Prisma para ORM com SQLite?

Rotas: Route Handlers (app/api) ou Server Actions? (posso sugerir Server Actions para simplicidade)

Validação: zod no server/client?

Seed inicial com os 5 alunos do exemplo da sua tabela?

8) Não-funcionais

Teste mínimo? (ex.: 1–2 testes de cálculo da média/filtro de risco com Vitest)

Acessibilidade: ok manter padrão do shadcn + labels?

Deploy da demo: rodará local ou quer Vercel (SQLite compatível)?

Persistência: aceitar perder dados a cada deploy ou quer arquivo .sqlite versionado em /data?

9) Extras (opcionais para brilhar na demo)

Filtro por status (aprovado/recuperação/reprovado) e por faixa de frequência?

Anotações por aluno (ex.: “precisa de monitoria”)?

Exportar CSV da planilha consolidada?

Tema claro/escuro?

Resposta:
1. sim, esses sao os objetivos, quanto mais coisa tiver melho 2. esse fluxo ta bom, adicione tbm a recuperação, (observação: o sistema de nota é o seguinte (G1 + G2 *2)/3, essa é a média final(MF) e a recuperação é (MF + Prova final * 2) / 3, conseguiu 6 é aprovado, as notas g1 e g2 e prova final vai de 0 a 10, mas a nota pode ser dividida livrimente, então pode haver 4 trabalhos q valem 1 ponto e a prova valer 6 por exemplo), essa conta se torna dificil do aluino saber quanto ele tem q tirar na G2 pra ser aprovado por exemplo, então adicione no software a opção de poder ver isso também) 3. sim, haverá 4. Campo pode ser só nome e número academico 5. expliquei acima 6. expliquei dnv 7. Sim, é bom gerar esse histórico e o ultimo valor, permitir exportar pra pdf a vizualização das notas dos alunos, evitando coisas inuteis, por exempl caso o professor queira mostrar só as notas q foram lançadas ate metade da G1 ele pode, e ao exportar nao vai aparecer as notas q ainda não foram definidas 8. Não precisa 9. um único 10.Decida vc mesmo, de acordo com tudo que eu te falei 11. sim, soft delete 12. por enquanto manual já basta 13. todas essas, narrativa atuomatica nao faça usando IA, pode ser regra fixa(nao sei o q isso singifica) 14. Só média, nao vai ter frequencia, decida vc qual nota é em risco ou não, use a regra do semaforo, para isso 15. sim, use os componentes do shadcn e tailwind, deixe muito bonito 16. Decida voce mesmo 17. sim 18. pode ser, como afchar melhor 19. server actions 20. nao sei o q é isso, vc q sabe 21. faça o inicial com muitos dados já, nao so isso 22. nao precisa 23. nao precisa 24. rodara local 25. versiona 26. sim 27. sim 28. sim 29. nao Faça também o software já pronto pra ser expandido para ter uma aréa q um aluno pode ver suas notas e informações pertinente sobre ele também, não precisa fazer isso por agora, ms deixe preparado pro futuro ser facil de implementar Me dê todo o processo de criação do software completo, desde o comando pra criar o projeto ate o fim das coisas dele, faça também um arquivo Agent.md para eu usar o codex para continuar por la, explique tudo isso passo a passo bem explicado com contexto completo, sem faltar nada, desde a idealização do seminário como um todo