import { ForgotPasswordForm } from "@/components/forgot-password-form";
import Image from "next/image";

export default function Page() {
  return (
		<div className="page-bg flex min-h-svh w-full items-center justify-center p-6 md:p-10">
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

			<div className="w-full max-w-sm">
				<div className="flex flex-col items-center gap-1 mb-6">
					<Image
						src="/kasarian-upb-logo.svg"
						alt="UPB Kasarian Gender Studies Program Logo"
						width={120}
						height={120}
						className="w-[70px] h-[70px] md:w-[120px] md:h-[120px]"
					/>
					<div className="flex flex-col items-center">
						<p className="body">UP BAGUIO KASARIAN</p>
						<h1 className="heading-lg md:heading-xl">
							OhMyGAD!
						</h1>
					</div>
				</div>
				<ForgotPasswordForm />
			</div>
		</div>
  );
}
