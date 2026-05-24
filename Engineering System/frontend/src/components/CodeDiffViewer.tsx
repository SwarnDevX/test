import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";

interface Props {
  original: string;
  patched: string;
}

const customStyles = {
  variables: {
    dark: {
      diffViewerBackground: "#0d1117",
      addedBackground: "#12261e",
      addedColor: "#7ee787",
      removedBackground: "#2d1214",
      removedColor: "#ffa198",
      wordAddedBackground: "#1a4731",
      wordRemovedBackground: "#4c1319",
      addedGutterBackground: "#12261e",
      removedGutterBackground: "#2d1214",
      gutterBackground: "#161b22",
      gutterColor: "#484f58",
      codeFoldGutterBackground: "#161b22",
      codeFoldBackground: "#161b22",
      emptyLineBackground: "#0d1117",
    },
  },
};

export default function CodeDiffViewer({ original, patched }: Props) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-800">
      <div className="bg-gray-900 px-4 py-2 border-b border-gray-800">
        <h3 className="text-sm font-bold text-blue-400">📝 Code Diff</h3>
      </div>
      <ReactDiffViewer
        oldValue={original}
        newValue={patched}
        splitView={true}
        useDarkTheme={true}
        leftTitle="Original Code"
        rightTitle="Proposed Fix"
        styles={customStyles}
        compareMethod={DiffMethod.WORDS}
      />
    </div>
  );
}

