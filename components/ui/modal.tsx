/*
How to use this component?

  PROPS
  open      boolean       — controls visibility               (required)
  onClose   () => void    — called when backdrop or × clicked (required)
  title     string        — bold heading inside the modal
  subtitle  string        — muted caption line below title
  children  ReactNode     — modal body content               (required)
  footer    ReactNode     — bottom action area (usually buttons)
 
  BEHAVIOUR
    Renders nothing when open=false.
    Clicking the backdrop calls onClose.
    Clicking inside the modal does NOT propagate to the backdrop.
    × button always calls onClose.
 
  SAMPLE USAGE
  1. Manage open state in the parent
  const [open, setOpen] = useState(false);
 
  2. Trigger button
  <Button onClick={() => setOpen(true)}>Register</Button>
 
  3. Modal with form body + footer buttons
  <Modal
    open={open}
    onClose={() => setOpen(false)}
    title="Register for Event"
    subtitle="Gender Sensitivity Orientation · Mar 15, 2025"
    footer={
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="ghost" style={{ flex: 1 }} onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button variant="primary" style={{ flex: 1 }} onClick={handleSubmit}>
          Confirm
        </Button>
      </div>
    }
  >
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Input label="Full Name"  value={name}  onChange={e => setName(e.target.value)} />
      <Input label="Student ID" value={sid}   onChange={e => setSid(e.target.value)} />
      <Select label="College" options={collegeOptions} />
    </div>
  </Modal>
 
  Confirm-delete variant (no form, just a warning)
  <Modal
    open={confirmOpen}
    onClose={() => setConfirmOpen(false)}
    title="Cancel Event?"
    subtitle="This cannot be undone. All registrations will be removed."
    footer={
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="ghost"   style={{ flex:1 }} onClick={() => setConfirmOpen(false)}>Keep Event</Button>
        <Button variant="primary" style={{ flex:1, background:"var(--error)" }} onClick={deleteEvent}>Yes, Cancel</Button>
      </div>
    }
  >
    <Toast variant="warning" title="28 participants are already registered." />
  </Modal>
 */

"use client";
 
import React from "react";
import { X } from "lucide-react";
 
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  modalStyle?: React.CSSProperties;
  modalClassName?: string;
  hideCloseButton?: boolean;
  contentStyle?: React.CSSProperties;
}

export function Modal({ open, onClose, title, subtitle, children, footer, modalStyle, modalClassName, hideCloseButton, contentStyle }: ModalProps) {
  if (!open) return null;
 
  return (
		<div className="modal-backdrop" onClick={onClose}>
			<div
				className={`modal${modalClassName ? ` ${modalClassName}` : ""}`}
				style={modalStyle}
				onClick={(e) => e.stopPropagation()}
			>
				{!hideCloseButton && (
					<button className="modal-close" onClick={onClose}>
						<X size={15} />
					</button>
				)}

				{(title || subtitle) && (
					<div
						style={{
							marginBottom: 10,
							flexShrink: 0,
							position: "sticky",
							top: 0,
							background: "var(--white)",
							zIndex: 1,
							paddingTop: 0,
						}}
					>
						{title && (
							<p
								className="heading-md"
								style={{ marginBottom: 6 }}
							>
								{title}
							</p>
						)}
						{subtitle && <p className="caption">{subtitle}</p>}
					</div>
				)}

				{/* makes the body scroll */}
				<div
					style={{
						flex: 1,
						overflowY: "auto",
						marginTop: -3,
						marginLeft: -3,
						marginRight: -3,
						marginBottom: footer ? 21 : -3,
						padding: 3,
						minHeight: 0,
						...contentStyle,
					}}
				>
					{children}
				</div>

				{/* footer sticks to bottom */}
				{footer && <div style={{ flexShrink: 0 }}>{footer}</div>}
			</div>
		</div>
  );
}