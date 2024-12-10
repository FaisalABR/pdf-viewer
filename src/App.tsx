import "./App.css";
import PDFViewer from "./components/pdf-viewer/PDFViewer";

function App() {
	return (
		<>
			<PDFViewer fileUrl="https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf" />
		</>
	);
}

export default App;
