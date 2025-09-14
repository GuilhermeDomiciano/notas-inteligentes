import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="py-10">
      <Card>
        <CardHeader>
          <CardTitle>Notas Inteligentes</CardTitle>
          <CardDescription>
            Mini-sistema para lançamento de notas e geração de relatórios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/classes">Ir para Turmas</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

