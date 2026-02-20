import React, { useEffect, useRef, useState } from 'react';

import { DataTable, type DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

import type { Artwork } from './types';
import { fetchArtworks } from './services/api';
export default function App() {
  const [rows, setRows] = useState<Artwork[]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(12);
  const [totalRecords, setTotalRecords] = useState(0);

  // 🔥 Persistent selection memory
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deselectedIds, setDeselectedIds] = useState<Set<number>>(new Set());

  // overlay
  const overlayRef = useRef<OverlayPanel>(null);
  const [selectCount, setSelectCount] = useState('');

  // 📡 Fetch page data (server-side pagination)
  useEffect(() => {
    const loadData = async () => {
      const res = await fetchArtworks(page);
      setRows(res.data);
      setTotalRecords(res.pagination.total);
    };

    loadData();
  }, [page]);

  // 🧠 Apply persistent selection to current page
  const selectedRows = rows.filter(
    (row) => selectedIds.has(row.id) && !deselectedIds.has(row.id)
  );

  // ✅ Single row select
  const onRowSelect = (row: Artwork) => {
    setSelectedIds((prev) => new Set(prev).add(row.id));
    setDeselectedIds((prev) => {
      const copy = new Set(prev);
      copy.delete(row.id);
      return copy;
    });
  };

  // ❌ Single row unselect
  const onRowUnselect = (row: Artwork) => {
    setDeselectedIds((prev) => new Set(prev).add(row.id));
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      copy.delete(row.id);
      return copy;
    });
  };

  // ☑️ Select all (CURRENT PAGE ONLY)
  const selectAllCurrentPage = () => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      rows.forEach((r) => copy.add(r.id));
      return copy;
    });

    setDeselectedIds((prev) => {
      const copy = new Set(prev);
      rows.forEach((r) => copy.delete(r.id));
      return copy;
    });
  };

  // 🔢 Custom row selection (NO PREFETCH)
  const handleCustomSelect = () => {
    const count = parseInt(selectCount);
    if (!count || count <= 0) return;

    const limit = Math.min(count, rows.length);

    setSelectedIds((prev) => {
      const copy = new Set(prev);
      rows.slice(0, limit).forEach((r) => copy.add(r.id));
      return copy;
    });

    setDeselectedIds((prev) => {
      const copy = new Set(prev);
      rows.slice(0, limit).forEach((r) => copy.delete(r.id));
      return copy;
    });

    setSelectCount('');
    overlayRef.current?.hide();
  };

  return (
    <div className="p-4">
      <h2>Art Institute of Chicago – Artworks</h2>

      <div className="mb-3 flex gap-2">
        <Button
          label="Select Rows"
          icon="pi pi-list"
          onClick={(e) => overlayRef.current?.toggle(e)}
        />
        <Button
          label="Select All (Current Page)"
          icon="pi pi-check-square"
          onClick={selectAllCurrentPage}
        />
      </div>

      <OverlayPanel ref={overlayRef}>
        <div className="flex flex-column gap-2">
          <InputText
            placeholder="Enter number of rows"
            value={selectCount}
            onChange={(e) => setSelectCount(e.target.value)}
          />
          <Button label="Apply" onClick={handleCustomSelect} />
        </div>
      </OverlayPanel>

      <DataTable
        value={rows}
        paginator
        rows={rowsPerPage}
        totalRecords={totalRecords}
        lazy
        first={(page - 1) * rowsPerPage}
        onPage={(e: DataTablePageEvent) => setPage(e.page! + 1)}
        selection={selectedRows}
        selectionMode="checkbox"
        dataKey="id"
        onRowSelect={(e) => onRowSelect(e.data)}
        onRowUnselect={(e) => onRowUnselect(e.data)}
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
      </DataTable>
    </div>
  );
}