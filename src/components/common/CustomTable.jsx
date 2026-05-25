import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { List } from "react-window";
import ResponsiveTextWrapper from "./ResponsiveTextWrapper";

export const CustomTable = ({ data, columns }) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();
  const totalTableWidth = table.getTotalSize();

  const RenderRow = React.useCallback(
    ({ index, style }) => {
      const row = rows[index];

      return (
        <TableRow
          component="div"
          style={{ ...style, display: "flex" }}
          key={row.id}
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell
              component="div"
              key={cell.id}
              sx={{
                // flex: cell.column.columnDef.size || 1,
                display: "flex",
                alignItems: "center",
                minWidth: cell.column.getSize(),
                maxWidth: cell.column.getSize(),
                p: 1,
              }}
            >
              <ResponsiveTextWrapper
                value={flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext(),
                )}
                fontSize="14px"
                fontWeight={500}
              />
            </TableCell>
          ))}
        </TableRow>
      );
    },
    [rows],
  );

  return (
    <>
      <Box height="100%" width="100%" overflow="auto" sx={{ borderRadius: 2 }}>
        <Table
          component="div"
          sx={{
            width: "100%",
            tableLayout: "fixed",
          }}
        >
          <TableHead component="div">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                component="div"
                key={headerGroup.id}
                sx={{ display: "flex", backgroundColor: "#F5F7FA" }}
              >
                {headerGroup.headers.map((header) => (
                  <TableCell
                    component="div"
                    key={header.id}
                    sx={{
                      flex: header.column.columnDef.size || 1,
                      minWidth: header?.getSize(),
                      maxWidth: header?.getSize(),
                      p: 1,
                    }}
                  >
                    <ResponsiveTextWrapper
                      value={
                        header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )
                      }
                      fontSize="14px"
                      fontWeight="bold"
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody component="div">
            <List
              rowCount={rows.length}
              rowHeight={40}
              rowComponent={RenderRow}
              rowProps={{}}
              // style={{ height: "100%", width: "100%" }}
            />
          </TableBody>
        </Table>
      </Box>
    </>
  );
};
