import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui";

interface PaginationProps {
	page: number;
	total: number;
	onChange: (p: number) => void;
}

export function Pagination({ page, total, onChange }: PaginationProps) {
	const getPageNumbers = (): (number | "...")[] => {
		// 1. If 5 or fewer total pages, just show them all
		if (total <= 5) {
			return Array.from({ length: total }, (_, i) => i + 1);
		}

		// 2. Near the start (e.g., page 1, 2, or 3)
		if (page <= 3) {
			return [1, 2, 3, "...", total];
		}

		// 3. Near the end
		if (page >= total - 2) {
			return [1, "...", total - 2, total - 1, total];
		}

		// 4. In the middle (shows exactly 5 items: [1, ..., page, ..., total])
		return [1, "...", page, "...", total];
	};

	return (
		<div className="flex items-center gap-1">
			{/* prev */}
			<Button
				variant="icon-sm"
				onClick={() => onChange(page - 1)}
				disabled={page === 1}
				aria-label="Previous page"
			>
				<ChevronLeft size={14} />
			</Button>

			{/* page numbers */}
			{getPageNumbers().map((p, i) =>
				p === "..." ? (
					<span
						key={`ellipsis-${i}`}
						className="caption text-gray-500"
						style={{ padding: "0 4px" }}
					>
						…
					</span>
				) : (
					<Button
						key={p}
						onClick={() => onChange(p as number)}
						className={`btn-page-num${page === p ? " active" : ""}`}
					>
						{p}
					</Button>
				),
			)}

			{/* next */}
			<Button
				variant="icon-sm"
				onClick={() => onChange(page + 1)}
				disabled={page === total}
				aria-label="Next page"
			>
				<ChevronRight size={14} />
			</Button>
		</div>
	);
}
