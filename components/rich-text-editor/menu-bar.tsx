import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Bold,
	Heading1,
	Heading2,
	Heading3,
	Highlighter,
	Italic,
	List,
	ListOrdered,
	Strikethrough,
	Underline as UnderlineIcon,
} from "lucide-react";
import { Button } from "../ui";
import { Editor } from "@tiptap/react";

export default function MenuBar({ editor }: { editor: Editor | null }) {
	if (!editor) {
		return null;
	}

	const Options = [
		{
			icon: <Heading1 className="size-4" />,
			onClick: () =>
				editor.chain().focus().toggleHeading({ level: 1 }).run(),
			pressed: editor.isActive("heading", { level: 1 }),
		},
		{
			icon: <Heading2 className="size-4" />,
			onClick: () =>
				editor.chain().focus().toggleHeading({ level: 2 }).run(),
			pressed: editor.isActive("heading", { level: 2 }),
		},
		{
			icon: <Heading3 className="size-4" />,
			onClick: () =>
				editor.chain().focus().toggleHeading({ level: 3 }).run(),
			pressed: editor.isActive("heading", { level: 3 }),
		},
		{
			icon: <Bold className="size-4" />,
			onClick: () => editor.chain().focus().toggleBold().run(),
			pressed: editor.isActive("bold"),
		},
		{
			icon: <Italic className="size-4" />,
			onClick: () => editor.chain().focus().toggleItalic().run(),
			pressed: editor.isActive("italic"),
		},
		{
			icon: <UnderlineIcon className="size-4" />,
			onClick: () => editor.chain().focus().toggleUnderline().run(),
			pressed: editor.isActive("underline"),
		},
		{
			icon: <Strikethrough className="size-4" />,
			onClick: () => editor.chain().focus().toggleStrike().run(),
			pressed: editor.isActive("strike"),
		},
		{
			icon: <AlignLeft className="size-4" />,
			onClick: () => editor.chain().focus().setTextAlign("left").run(),
			pressed: editor.isActive({ textAlign: "left" }),
		},
		{
			icon: <AlignCenter className="size-4" />,
			onClick: () => editor.chain().focus().setTextAlign("center").run(),
			pressed: editor.isActive({ textAlign: "center" }),
		},
		{
			icon: <AlignRight className="size-4" />,
			onClick: () => editor.chain().focus().setTextAlign("right").run(),
			pressed: editor.isActive({ textAlign: "right" }),
		},
		{
			icon: <List className="size-4" />,
			onClick: () => editor.chain().focus().toggleBulletList().run(),
			pressed: editor.isActive("bulletList"),
		},
		{
			icon: <ListOrdered className="size-4" />,
			onClick: () => editor.chain().focus().toggleOrderedList().run(),
			pressed: editor.isActive("orderedList"),
		},
		{
			icon: <Highlighter className="size-4" />,
			onClick: () => editor.chain().focus().toggleHighlight().run(),
			pressed: editor.isActive("highlight"),
		},
	];

	return (
		<div className="sticky top-0 z-20 p-1.5 flex items-center flex-wrap gap-1 bg-[var(--lavender)] border-b border-[rgba(45,42,74,0.12)]">
			{Options.map((option, index) => (
				<Button
					key={index}
					type="button"
					onClick={(e) => {
						e.preventDefault();
						option.onClick();
					}}
					variant={option.pressed ? "icon-dark" : "icon"}
					className="w-8 h-8 min-w-[32px] min-h-[32px]"
				>
					{option.icon}
				</Button>
			))}
		</div>
	);
}
