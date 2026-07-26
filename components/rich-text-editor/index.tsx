// https://github.com/candraKriswinarto/my-rich-text-editor/tree/main

"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import MenuBar from "./menu-bar";

interface TiptapProps {
	value?: string;
	onChange?: (value: string) => void;
	maxLength?: number;
}

const Tiptap = ({ value = "", onChange, maxLength = 100000 }: TiptapProps) => {
	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			TextAlign.configure({
				types: ["heading", "paragraph"],
			}),
			Highlight,
		],
		content: value,
		immediatelyRender: false,
		onUpdate: ({ editor }) => {
			onChange?.(editor.getHTML());
		},
		editorProps: {
			attributes: {
				class:
					"p-4 min-h-[200px] max-h-[380px] overflow-y-auto custom-scrollbar focus:outline-none text-[var(--primary-dark)] text-sm prose max-w-none",
			},
		},
	});

	useEffect(() => {
		if (editor && value !== editor.getHTML()) {
			editor.commands.setContent(value);
		}
	}, [value, editor]);

	const charCount = editor ? editor.getText().length : 0;
	const isOverLimit = maxLength ? charCount > maxLength : false;

	return (
		<div className="flex flex-col gap-1 w-full">
			<div className="rounded-2xl border border-[rgba(45,42,74,0.18)] bg-white overflow-hidden flex flex-col focus-within:border-[var(--primary-dark)] transition-colors relative w-full">
				<MenuBar editor={editor} />
				<EditorContent editor={editor} />
			</div>
			{maxLength && (
				<div
					className={`text-xs mt-1 font-medium text-right ${
						isOverLimit
							? "text-[var(--error)] font-bold"
							: "text-gray-500"
					}`}
				>
					{charCount.toLocaleString()} / {maxLength.toLocaleString()}{" "}
					characters
				</div>
			)}
		</div>
	);
};

export default Tiptap;
