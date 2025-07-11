'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Quiz from "@/components/quiz";
import { Puzzle } from "lucide-react";
import { useSellerContext } from "../layout";

export default function QuizPage() {
  const { goals } = useSellerContext();

  return (
    <div className="space-y-8">
       <div className="flex items-center gap-4">
        <Puzzle className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Quizzes</h1>
      </div>
      <Card className="bg-card border-border">
         <CardHeader>
          <CardTitle className="text-xl">Teste seus Conhecimentos</CardTitle>
          <CardDescription>
            Gere quizzes aleatórios sobre técnicas de venda e conhecimento de produtos em lojas de calçados.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Quiz goals={goals} />
        </CardContent>
      </Card>
    </div>
  );
}
