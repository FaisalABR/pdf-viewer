import { useRef, useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer.mjs";
import "pdfjs-dist/web/pdf_viewer.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const PDFViewer = ({ fileUrl }) => {
	const [pdfDocument, setPdfDocument] =
		useState<pdfjsLib.PDFDocumentProxy | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [scale, setScale] = useState(1.0);
	const pdfViewerRef = useRef<pdfjsViewer.PDFViewer | null>(null);
	const viewerContainer = useRef<HTMLDivElement>(null);
	const viewer = useRef<HTMLDivElement>(null);

	const debounce = (func, delay) => {
		let timeoutId;
		return (...args) => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				func(...args);
			}, delay);
		};
	};

	useEffect(() => {
		const eventBus = new pdfjsViewer.EventBus();
		const pdfLinkService = new pdfjsViewer.PDFLinkService({ eventBus });
		const pdfFindContoller = new pdfjsViewer.PDFFindController({
			eventBus,
			linkService: pdfLinkService,
		});

		pdfjsLib.getDocument(fileUrl).promise.then((pdf) => {
			setPdfDocument(pdf);
			const pdfViewer = new pdfjsViewer.PDFViewer({
				eventBus,
				container: viewerContainer.current!,
				viewer: viewer.current!,
				linkService: pdfLinkService,
				findController: pdfFindContoller,
			});

			pdfLinkService.setViewer(pdfViewer);
			pdfViewerRef.current = pdfViewer;
			pdfViewer.setDocument(pdf);
			pdfLinkService.setDocument(pdf, null);

			pdfLinkService.setViewer(pdfViewer);

			// Update saat halaman berubah
			eventBus.on("pagechanging", (event) => {
				setCurrentPage(event.pageNumber);
			});
		});
	}, [fileUrl]);

	useEffect(() => {
		if (pdfDocument && pdfViewerRef.current) {
			const timeoutId = setTimeout(() => {
				try {
					pdfViewerRef.current!.currentScale = scale;
					pdfViewerRef.current!.currentPageNumber = currentPage;
				} catch (error) {
					console.error("Error setting scale or page:", error);
				}
			}, 100);
			// Penundaan 100ms untuk memastikan render
			return () => clearTimeout(timeoutId);
		}
	}, [pdfDocument, currentPage, scale]);

	useEffect(() => {
		const container = viewerContainer.current;
		if (container && pdfViewerRef.current) {
			const handleScroll = debounce(() => {
				const viewer = pdfViewerRef.current;
				if (viewer) {
					// Update halaman saat ini
					const newPage = viewer.currentPageNumber;
					if (newPage !== currentPage) {
						setCurrentPage(newPage);
					}
				}
			}, 100);

			container.addEventListener("scroll", handleScroll);

			return () => {
				container.removeEventListener("scroll", handleScroll);
			};
		}
	}, [currentPage]);

	const nextPage = () => {
		if (pdfDocument && currentPage < pdfDocument.numPages) {
			setCurrentPage((prev) => prev + 1);
		}
	};

	// Fungsi untuk navigasi ke halaman sebelumnya
	const prevPage = () => {
		if (pdfDocument && currentPage > 1) {
			setCurrentPage((prev) => prev - 1);
		}
	};

	// Fungsi untuk memperbesar tampilan
	const zoomIn = () => {
		setScale((prev) => Math.min(prev + 0.25, 3)); // Maks zoom 3x
	};

	// Fungsi untuk memperkecil tampilan
	const zoomOut = () => {
		setScale((prev) => Math.max(prev - 0.25, 0.5)); // Min zoom 0.5x
	};

	return (
		<div id="mainContainer">
			<div className="toolbar">
				<div className="toolbar-pages">
					<button onClick={prevPage} disabled={currentPage === 1}>
						Previous
					</button>
					<span style={{ color: "white" }}>
						Page {currentPage} of {pdfDocument?.numPages || 0}
					</span>
					<button
						onClick={nextPage}
						disabled={currentPage === pdfDocument?.numPages}
					>
						Next
					</button>
				</div>
				<button onClick={zoomOut}>Zoom Out</button>
				<button onClick={zoomIn}>Zoom In</button>
			</div>
			<div
				id="viewerContainer"
				style={{ position: "absolute" }}
				ref={viewerContainer}
			>
				<div id="viewer" ref={viewer} className="pdfViewer" />
			</div>
		</div>
	);
};

export default PDFViewer;
