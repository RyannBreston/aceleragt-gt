'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SalesEntry } from '@/lib/types';
import { format } from 'date-fns';

type SalesTableProps = {
  salesData: SalesEntry[];
};

export default function SalesTable({ salesData }: SalesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Entries</CardTitle>
        <CardDescription>A list of recent sales records.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Sales Value</TableHead>
                <TableHead className="text-right">Ticket Average</TableHead>
                <TableHead className="text-right">PPA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData.length > 0 ? (
                salesData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(entry.date, 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      ${entry.salesValue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${entry.ticketAverage.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.productsPerService.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No sales data available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
