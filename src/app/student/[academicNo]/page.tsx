export default function StudentAreaPlaceholder({ params }: { params: { academicNo: string } }) {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Área do Aluno</h1>
      <p>Página em preparação para o aluno <strong>{params.academicNo}</strong>.</p>
      <p>Em breve: notas, médias e orientações personalizadas.</p>
    </div>
  )
}

