import { SignUpForm } from "@/components/sign-up-form";
import Image from "next/image";

export default function SignUpPage() {
	return (
		<div className="page-bg relative w-full min-h-screen overflow-hidden flex items-center justify-center p-4 sm:p-8">
			{/* --- design --- */}
			<div
				className="blob blob-pink hidden md:block"
				style={{
					width: 500,
					height: 500,
					top: -120,
					right: -120,
					opacity: 0.3,
				}}
			/>
			<div
				className="blob blob-periwinkle hidden md:block"
				style={{
					width: 400,
					height: 400,
					bottom: 100,
					left: -100,
					opacity: 0.4,
				}}
			/>

			{/* --- two-column layout --- */}
			<div className="z-10 w-full max-w-4xl animate-in fade-in zoom-in-95 duration-500 flex flex-col md:flex-row md:items-center md:gap-12">
				{/* left column — title */}
				<div className="flex flex-col items-center md:items-start text-left gap-4 md:flex-1 mb-6 md:mb-0">
					<div className="flex flex-col md:flex-row items-center gap-1">
						<Image
							src="/kasarian-upb-logo.svg"
							alt="UPB Kasarian Gender Studies Program Logo"
							width={120}
							height={120}
							className="w-[70px] h-[70px] md:w-[120px] md:h-[120px]"
						/>
						<div className="flex flex-col items-center md:items-start">
							<p className="caption text-lg">
								UP BAGUIO KASARIAN
							</p>
							<h1 className="heading-lg md:heading-xl">
								OhMyGAD!
							</h1>
						</div>
					</div>
					<p className="caption text-center md:text-left md:block text-[var(--text-muted)] max-w-xs md:pl-4">
						A centralized platform for GSO-related events,
						activities, and guidelines.
					</p>
				</div>

				{/* Right column — login form */}
				<div className="md:flex-1">
					<SignUpForm />
				</div>
			</div>
		</div>
	);
}