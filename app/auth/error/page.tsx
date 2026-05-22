import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import Image from "next/image";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="body text-center text-muted-foreground">
          Code error: {params.error}
        </p>
      ) : (
        <p className="body text-center text-muted-foreground">
          An unspecified error occurred.
        </p>
      )}
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
		<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 page-bg">
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
				<div className="flex flex-col gap-6">
					<div className="items-center gap-4 p-6">
						<div className="flex flex-col items-center gap-1">
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
						<h1 className="mt-4 heading-sm text-center">
							Sorry, something went wrong.
						</h1>
						<Suspense>
							<ErrorContent searchParams={searchParams} />
						</Suspense>
					</div>
				</div>
			</div>
		</div>
  );
}
