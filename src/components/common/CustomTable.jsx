import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { List } from 'react-window';

export const CustomTable = ({ data, columns, height = 400 }) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  const RenderRow = React.useCallback(
    ({ index, style }) => {
      const row = rows[index];
      return (
        <TableRow component="div" style={{ ...style, display: 'flex' }} key={row.id}>
          {row.getVisibleCells().map((cell) => (
            <TableCell
              component="div"
              key={cell.id}
              sx={{
                flex: cell.column.columnDef.size || 1,
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      );
    },
    [rows]
  );

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Table component="div">
        <TableHead component="div">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow component="div" key={headerGroup.id} sx={{ display: 'flex', backgroundColor: '#F5F7FA' }}>
              {headerGroup.headers.map((header) => (
                <TableCell
                  component="div"
                  key={header.id}
                  sx={{
                    flex: header.column.columnDef.size || 1,
                    fontWeight: 'bold',
                    color: '#1A202C',
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody component="div">
          <List
            rowCount={rows.length}
            rowHeight={50}
            rowComponent={RenderRow}
            rowProps={{}}
            style={{ height, width: '100%' }}
          />
        </TableBody>
      </Table>
    </TableContainer>
  );
};
