// src/app/api/missions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Schema para validar o ID da missão (CUID)
const idSchema = z.string().cuid("ID da missão inválido");

// Schema para validar os dados de atualização da missão
const updateMissionSchema = z.object({
  title: z.string().min(1, "O título é obrigatório").optional(),
  description: z.string().optional().nullable(),
  points: z.number().int().min(0, "Os pontos devem ser um número positivo").optional(),
  type: z.string().optional().nullable(),
  goal: z.number().min(0, "O objetivo deve ser um número positivo").optional().nullable(),
  prize: z.number().min(0, "O prêmio deve ser um número positivo").optional().nullable(),
  course_id: z.string().cuid("ID do curso inválido").optional().nullable(),
}).refine(data => Object.keys(data).length > 0, {
  message: "Pelo menos um campo deve ser fornecido para a atualização"
});

// Função helper para lidar com erros
const handleError = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return NextResponse.json({ error: 'Missão não encontrada' }, { status: 404 });
  }
  console.error('Erro na operação com a missão:', error);
  return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
};

// GET - Obter uma missão específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const validationResult = idSchema.safeParse(id);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'ID inválido', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const mission = await prisma.mission.findUnique({
      where: { id: validationResult.data },
    });

    if (!mission) {
      return NextResponse.json({ error: 'Missão não encontrada' }, { status: 404 });
    }

    return NextResponse.json(mission);
  } catch (error) {
    return handleError(error);
  }
}

// PUT - Atualizar uma missão
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const idValidation = idSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'ID da missão inválido', details: idValidation.error.format() },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = updateMissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados para atualização inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const updatedMission = await prisma.mission.update({
      where: { id: idValidation.data },
      data: validationResult.data,
    });

    return NextResponse.json(updatedMission);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE - Deletar uma missão
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const idValidation = idSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'ID da missão inválido', details: idValidation.error.format() },
        { status: 400 }
      );
    }

    await prisma.mission.delete({
      where: { id: idValidation.data },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    return handleError(error);
  }
}
