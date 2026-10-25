/*
How to use this component?
  COMPOSITION PATTERN
  <Dropdown trigger={…}>
    <DropdownItem icon={…}>Label</DropdownItem>
    <DropdownDivider />
    <DropdownItem danger>Destructive action</DropdownItem>
  </Dropdown>

Dropdown

  PROPS 
  trigger   ReactNode   — element that opens the menu on click (required)
                          usually a <Button>
  children  ReactNode   — DropdownItem / DropdownDivider nodes (required)
 
  BEHAVIOUR
    Opens on trigger click, closes when mouse leaves the menu.

DropdownItem 

  PROPS
  children  ReactNode           — item label text             (required)
  icon      ReactNode           — Lucide icon on the left
  danger    boolean             — red text / destructive style default false
  onClick   () => void          — click handler
 
DropdownDivider  
  No props. Renders a horizontal rule between groups of items.
 
SAMPLE USAGE  
  import { Eye, Pencil, Users, Trash2, Filter } from "lucide-react";
 
  // Action menu on an event row
  <Dropdown trigger={<Button variant="primary">Actions <Filter size={14}/></Button>}>
    <DropdownItem icon={<Eye size={15}/>} onClick={() => viewEvent(id)}>
      View Details
    </DropdownItem>
    <DropdownItem icon={<Pencil size={15}/>} onClick={() => editEvent(id)}>
      Edit Event
    </DropdownItem>
    <DropdownItem icon={<Users size={15}/>} onClick={() => viewRegistrants(id)}>
      View Registrants
    </DropdownItem>
    <DropdownDivider />
    <DropdownItem icon={<Trash2 size={15}/>} danger onClick={() => cancelEvent(id)}>
      Cancel Event
    </DropdownItem>
  </Dropdown>
 
  // Export menu
  <Dropdown trigger={<Button variant="ghost">Export ▾</Button>}>
    <DropdownItem icon={<Download size={15}/>} onClick={exportCSV}>Export as CSV</DropdownItem>
    <DropdownItem icon={<Download size={15}/>} onClick={exportPDF}>Export as PDF</DropdownItem>
  </Dropdown>
 */

"use client";

import { useState } from "react";
import React from "react";
import { usePathname } from "next/navigation";

//  DropdownItem
interface DropdownItemProps {
	icon?: React.ReactNode;
	children: React.ReactNode;
	danger?: boolean;
	onClick?: () => void;
}

export function DropdownItem({
	icon,
	children,
	danger,
	onClick,
}: DropdownItemProps) {
	return (
		<div
			className={`dropdown-item${danger ? " danger" : ""}`}
			onClick={onClick}
		>
			{icon}
			{children}
		</div>
	);
}

export function DropdownDivider() {
	return <div className="dropdown-divider" />;
}

//  Dropdown
interface DropdownProps {
	trigger: React.ReactNode;
	children: React.ReactNode;
	menuStyle?: React.CSSProperties;
}

export function Dropdown({ trigger, children, menuStyle }: DropdownProps) {
	const [open, setOpen] = useState(false);
	const [pos, setPos] = React.useState<{
		top: number;
		right: number;
		maxWidth: number;
	} | null>(null);
	const ref = React.useRef<HTMLDivElement>(null);
	const pathname = usePathname();

	React.useEffect(() => {
		setOpen(false);
	}, [pathname]);

	React.useEffect(() => {
		function handleOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node))
				setOpen(false);
		}
		function handleResize() {
			setOpen(false);
		}
		if (open) {
			document.addEventListener("mousedown", handleOutside);
			window.addEventListener("resize", handleResize);
		}
		return () => {
			document.removeEventListener("mousedown", handleOutside);
			window.removeEventListener("resize", handleResize);
		};
	}, [open]);

	function handleClick() {
		if (!open && ref.current) {
			const rect = ref.current.getBoundingClientRect();
			const rightFromEdge = Math.max(0, window.innerWidth - rect.right);
			setPos({
				top: rect.bottom + 8,
				right: rightFromEdge,
				// max width that keeps the left edge ≥ 8px from the viewport
				maxWidth: window.innerWidth - rightFromEdge - 8,
			});
		}
		setOpen((o) => !o);
	}

	return (
		<div className="dropdown" ref={ref}>
			<div onClick={handleClick}>{trigger}</div>
			{open && pos && (
				<div
					className="dropdown-menu"
					style={{
						position: "fixed",
						zIndex: 50,
						top: pos.top,
						right: pos.right,
						left: "auto",
						width: "max-content",
						...menuStyle,
						// enforce viewport-safe maxWidth regardless of what menuStyle requests
						maxWidth: pos.maxWidth,
					}}
				>
					{children}
				</div>
			)}
		</div>
	);
}
