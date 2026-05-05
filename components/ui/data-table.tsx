/*
  PROPS
  
  columns       Column<T>[]                                    (required)
				Array of column definitions - see Column<T> shape below.
  rows          T[]                                            (required)
				Array of data objects; T can be any type.
  keyExtractor  (row: T, index: number) => string             (required)
				Returns a unique React key for each row.
 
  Column<T> SHAPE
  
  key     string                         - unique column identifier
  header  string                         - column heading text
  render  (row: T, index: number)        - returns the cell content
		  => React.ReactNode               (string, JSX, Badge, Avatar…)
 
  NOTES
  Rendered inside an card with overflow:hidden so it gets the card border-radius automatically.
 
  SAMPLE USAGE
  
  import { DataTable } from "@/components/ui";
  import type { Column } from "@/components/ui";
  import { Badge, Avatar } from "@/components/ui";
 
  type User = {
	id:      string;
	name:    string;
	college: string;
	role:    string;
	status:  "completed" | "pending" | "none";
  };
 
  const columns: Column<User>[] = [
	{
	  key: "name",
	  header: "User",
	  render: (row, i) => (
		<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
		  <Avatar
			initials={row.name.split(" ").map(n => n[0]).join("").slice(0,2)}
			size="sm"
			variant={i % 2 === 0 ? "pink" : "periwinkle"}
		  />
		  <span style={{ fontWeight: 500 }}>{row.name}</span>
		</div>
	  ),
	},
	{
	  key: "college",
	  header: "College",
	  render: (row) => row.college,
	},
	{
	  key: "role",
	  header: "Role",
	  render: (row) => (
		<Badge variant={row.role === "Faculty" ? "periwinkle" : "pink"}>
		  {row.role}
		</Badge>
	  ),
	},
	{
	  key: "status",
	  header: "GSO Status",
	  render: (row) => (
		<Badge variant={
		  row.status === "completed" ? "success" :
		  row.status === "pending"   ? "warning" : "error"
		}>
		  {row.status}
		</Badge>
	  ),
	},
	{
	  key: "actions",
	  header: "Actions",
	  render: (row) => (
		<div style={{ display: "flex", gap: 6 }}>
		  <Button variant="icon" onClick={() => viewUser(row.id)}><Eye size={14}/></Button>
		  <Button variant="icon" onClick={() => editUser(row.id)}><Pencil size={14}/></Button>
		</div>
	  ),
	},
  ];
 
  const rows: User[] = [
	{ id: "2021-00142", name: "Maria Santos",   college: "CSS", role: "Student", status: "completed" },
	{ id: "2020-03301", name: "Juan Dela Cruz", college: "CS",   role: "Student", status: "pending"   },
	{ id: "FAC-0042",   name: "Dr. Ana Reyes",  college: "CAC",  role: "Faculty", status: "completed" },
  ];
 
  <DataTable
	columns={columns}
	rows={rows}
	keyExtractor={(row) => row.id}
  />
*/


import React from "react";

// types
export interface Column<T> {
	key: string;
	header: React.ReactNode;
	render: (row: T, index: number) => React.ReactNode;
	width?: string;
}

interface DataTableProps<T> {
	columns: Column<T>[];
	rows: T[];
	keyExtractor: (row: T, index: number) => string;
	minRows?: number;
	onRowClick?: (row: T, index: number) => void;
}

// DataTable
export function DataTable<T>({ columns, rows, keyExtractor, minRows, onRowClick }: DataTableProps<T>) {
	const padCount = minRows && minRows > rows.length ? minRows - rows.length : 0;

	return (
    <div
      className="card"
      style={{
        padding: 0,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <table className="table" style={{ tableLayout: "fixed" }}>
        <thead>
          	<tr
                style={{
                    background: "rgba(244, 235, 255, 0.25)",
                }}
            >
				{columns.map((col) => (
					<th
						key={col.key}
						draggable={false}
						style={col.width ? { width: col.width } : undefined}
					>
					{col.header}
				</th>
				))}
          	</tr>
        </thead>
        <tbody>
			{rows.map((row, i) => (
				<tr
					key={keyExtractor(row, i)}
					onClick={() => onRowClick?.(row, i)}
					style={{
						background:
						i % 2 === 0 ? "transparent" : "rgba(255, 235, 245, 0.25)",
						...(onRowClick ? { cursor: "pointer" } : {}),
					}}
				>
					{columns.map((col) => (
						<td key={col.key}>{col.render(row, i)}</td>
					))}
				</tr>
			))}
			{Array.from({ length: padCount }).map((_, i) => (
				<tr key={`__pad_${i}`} aria-hidden="true">
					{columns.map((col) => (
						<td key={col.key}>&nbsp;</td>
					))}
				</tr>
			))}
        </tbody>
      </table>
    </div>
  );
}