/* eslint-disable no-console */
import { PrismaClient, Bucket } from '@prisma/client'
import { addDays } from 'date-fns'

const prisma = new PrismaClient()

function rand(min:number,max:number){ return Math.random()*(max-min)+min }
function clamp(x:number, min:number, max:number){ return Math.max(min, Math.min(max, x)) }

async function main() {
  // Turma exemplo
  const klass = await prisma.class.create({
    data: { name: 'Disciplina X', term: '2025/2' }
  })

  // Atividades G1 (4x1 + 1x6)
  let order = 1
  const g1Acts = [
    { title: 'Trabalho 1', weight: 1 },
    { title: 'Trabalho 2', weight: 1 },
    { title: 'Trabalho 3', weight: 1 },
    { title: 'Trabalho 4', weight: 1 },
    { title: 'Prova G1',   weight: 6 },
  ]
  const g1 = await Promise.all(g1Acts.map((a,i)=>
    prisma.activity.create({
      data: { classId: klass.id, title: a.title, bucket: 'G1', weight: a.weight, order: order++, dueAt: addDays(new Date(), i-20) }
    })
  ))

  // Atividades G2 (4x1 + 1x6)
  const g2Acts = [
    { title: 'Trabalho 5', weight: 1 },
    { title: 'Trabalho 6', weight: 1 },
    { title: 'Trabalho 7', weight: 1 },
    { title: 'Trabalho 8', weight: 1 },
    { title: 'Prova G2',   weight: 6 },
  ]
  const g2 = await Promise.all(g2Acts.map((a,i)=>
    prisma.activity.create({
      data: { classId: klass.id, title: a.title, bucket: 'G2', weight: a.weight, order: order++, dueAt: addDays(new Date(), i-5) }
    })
  ))

  // Prova final (peso 10)
  const finalAct = await prisma.activity.create({
    data: { classId: klass.id, title: 'Prova Final', bucket: 'FINAL', weight: 10, order: order++, dueAt: addDays(new Date(), 15) }
  })

  // 30 alunos
  const names = ['Ana Clara','João Pedro','Mariana','Felipe','Camila','Bruno','Larissa','Igor','Rafaela','Mateus','Júlia','Caio','Paula','Lucas','Bianca','Diego','Carla','Vitor','Isabela','Otávio','Nina','Leandro','Gustavo','Mirela','Sofia','Eduardo','Helena','Mauro','Priscila','Tales']
  for (let i=0;i<names.length;i++){
    const st = await prisma.student.create({
      data: { classId: klass.id, name: names[i], academicNo: `2025${String(i+1).padStart(3,'0')}` }
    })

    // lançar notas "variadas" (inclui lacunas)
    const allActs = [...g1, ...g2]
    for (const a of allActs){
      const emit = Math.random() > 0.1 // 10% sem lançamento
      await prisma.studentActivityGrade.create({
        data: { studentId: st.id, activityId: a.id, points: emit ? clamp(rand(0.5, a.weight),0,a.weight) : null }
      })
    }

    // Prova final: inicialmente sem lançamento
    await prisma.studentActivityGrade.create({
      data: { studentId: st.id, activityId: finalAct.id, points: null }
    })
  }

  console.log('Seed concluído!')
}

main().catch(e=>{
  console.error(e); process.exit(1)
}).finally(async ()=> await prisma.$disconnect())
