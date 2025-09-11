'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import type { Seller } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface SalesTableProps {
  sellers: Seller[];
}

export default function SalesTable({ sellers }: SalesTableProps) {
  const [sortField, setSortField] = useState<'points' | 'sales_value'>('points');
  const [sortAsc, setSortAsc] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // combined filter, sort, and paginate
  const filteredSorted = useMemo(() => {
    // filter by name or email
    const filtered = sellers.filter(s =>
      s.name.toLowerCase().includes(filterText.toLowerCase()) ||
      s.email.toLowerCase().includes(filterText.toLowerCase())
    );
    // sort
    return filtered.sort((a, b) => {
      const aVal = sortField === 'points' ? a.points || 0 : a.sales_value || 0;
      const bVal = sortField === 'points' ? b.points || 0 : b.sales_value || 0;
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }, [sellers, sortField, sortAsc, filterText]);
  const totalPages = Math.ceil(filteredSorted.length / pageSize) || 1;
  const paginated = filteredSorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // export current filtered+sorted list to CSV
  const exportCSV = () => {
    const headers = ['Posição', 'Nome', 'Email', 'Vendas', 'Pontos'];
    const rows = filteredSorted.map((s, idx) => [
      idx + 1,
      s.name,
      s.email,
      (s.sales_value || 0).toFixed(2),
      (s.points || 0).toString(),
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ranking.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Buscar nome ou email..."
          className="border rounded px-2 py-1"
          value={filterText}
          onChange={e => { setFilterText(e.target.value); setCurrentPage(1); }}
        />
        <button onClick={exportCSV} className="px-3 py-1 bg-blue-500 text-white rounded">
          Exportar CSV
        </button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Posição</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right cursor-pointer" onClick={() => {
                if (sortField === 'sales_value') setSortAsc(!sortAsc);
                else { setSortField('sales_value'); setSortAsc(false); }
              }}>
              <div className="flex items-center justify-end">
                Vendas
                {sortField === 'sales_value' ? (
                  sortAsc ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                ) : <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />}
              </div>
            </TableHead>
            <TableHead className="text-right cursor-pointer" onClick={() => {
                if (sortField === 'points') setSortAsc(!sortAsc);
                else { setSortField('points'); setSortAsc(false); }
              }}>
              <div className="flex items-center justify-end">
                Pontos
                {sortField === 'points' ? (
                  sortAsc ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                ) : <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((seller, idx) => (
            <TableRow key={seller.id}>
              <TableCell>
                {((currentPage - 1) * pageSize + idx + 1) <= 3 ? (
                  <Badge variant="outline" className="w-8 text-center">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </Badge>
                ) : (
                  <span className="w-8 inline-block text-center">{(currentPage - 1) * pageSize + idx + 1}</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="hidden h-9 w-9 sm:flex">
                    <AvatarFallback>{seller.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="font-medium">{seller.name}</div>
                </div>
              </TableCell>
              <TableCell>{seller.email}</TableCell>
              <TableCell className="text-right">{formatCurrency(seller.sales_value || 0)}</TableCell>
              <TableCell className="text-right">
                  <Badge variant="secondary">{seller.points || 0}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* pagination controls */}
      <div className="flex items-center justify-center mt-4 space-x-2">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >Anterior</button>
        <span>Página {currentPage} de {totalPages}</span>
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >Próxima</button>
      </div>
    </div>
  );
}