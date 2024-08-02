import "./App.css";
import { invoke } from "@tauri-apps/api";
import { ArrowUpToLine, ClipboardCopy, FileInput, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Separator } from "./components/separator";
import { ProgressBar } from "./components/progress-bar";
import { MenuItem } from "./components/menu-item";

function App() {
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const onDrop = useCallback(
    (acceptedFiles: File[]) => handleStartUpload(acceptedFiles),
    []
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  console.log(isDragActive);

  function handleStartUpload(files: File[]) {
    setUploadQueue(files);
  }

  function handleQuit() {
    invoke("quit_app");
  }

  function handleCancelUpload() {
    setUploadQueue([]);
  }

  const status =
    uploadQueue.length > 0 ? "accept" : isDragActive ? "active" : "pending";

  return (
    <div className="space-y-1">
      <div
        {...getRootProps()}
        className="text-white/80 m-4 px-4 h-24 flex items-center border border-dashed rounded justify-center"
      >
        <input {...getInputProps()} />

        {status === "active" && "Start upload..."}

        {status === "accept" && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              {uploadQueue.length > 1 ? (
                <p className="animate-pulse">
                  Uploading {uploadQueue.length} file(s)...
                </p>
              ) : (
                <p className="animate-pulse">
                  Uploading{" "}
                  {uploadQueue[0].name.length > 14
                    ? uploadQueue[0].name.substring(0, 14).concat("...")
                    : uploadQueue[0].name}
                </p>
              )}

              <button
                onClick={handleCancelUpload}
                title="Cancel upload"
                className="text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ProgressBar progress={40} />
          </div>
        )}

        {status === "pending" && (
          <div className="flex items-center gap-3">
            <ArrowUpToLine className="w-4 h-4" />
            <p>Drag files here...</p>
          </div>
        )}
      </div>
      <Separator />
      <nav className="px-1.5 w-full">
        <MenuItem onClick={open} hotkey="mod+o">
          <FileInput className="w-4 h-4 stroke-[1.5px]" />
          Select file
        </MenuItem>

        <MenuItem hotkey="mod+shift+v">
          <ClipboardCopy className="w-4 h-4 stroke-[1.5px]" />
          Upload from clipboard
        </MenuItem>
        <Separator />
        <MenuItem hotkey="mod+q" onClick={handleQuit}>
          Quit
        </MenuItem>
      </nav>
    </div>
  );
}

export default App;
