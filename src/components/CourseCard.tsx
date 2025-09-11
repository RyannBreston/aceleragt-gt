import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

interface CourseCardProps {
  course: Course;
  onAccess?: (courseId: string) => void;
}

export default function CourseCard({ course, onAccess }: CourseCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      {course.imageUrl && (
        <div className="relative h-40 w-full">
          <Image src={course.imageUrl} alt={course.title} fill className="object-cover rounded-t-md" />
        </div>
      )}
      <CardHeader>
        <CardTitle>{course.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
        <Button variant="outline" onClick={() => onAccess?.(course.id)}>
          Acessar
        </Button>
      </CardContent>
    </Card>
  );
}
