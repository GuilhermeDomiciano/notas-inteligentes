import Link from "next/link";

export default function Home() {
  return (
    <main className="p-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Notas Inteligentes</h1>
        <p className="text-muted-foreground">Acesse o painel administrativo:</p>
        <Link href="/classes" className="text-blue-600 underline">Ir para Turmas</Link>
      </div>
    </main>
  );
}
