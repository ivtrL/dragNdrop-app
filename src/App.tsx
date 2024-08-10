import "./App.css";
import { invoke } from "@tauri-apps/api/core";
import { Event, listen } from "@tauri-apps/api/event";
import { ArrowUpToLine, ClipboardCopy, FileInput, X } from "lucide-react";
import { useEffect, useState } from "react";
import useMeasure from "react-use-measure";
import { useDropzone } from "react-dropzone";
import { Separator } from "./components/separator";
import { ProgressBar } from "./components/progress-bar";
import { MenuItem } from "./components/menu-item";

type DroppedFile = {
  path: string;
  x: number;
  y: number;
  buffer: string;
};

type MouseDropOver = {
  position: {
    x: number;
    y: number;
  };
};

function App() {
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [overDropZone, setOverDropZone] = useState<boolean>(false);
  const [dropZoneRef, bounds] = useMeasure();

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleStartUpload,
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  function getFileName(path: string) {
    const normalizedPath = path.replace(/\\/g, "/");

    return normalizedPath.split("/").pop() || "";
  }

  async function handleDroppedFile(event: Event<DroppedFile>) {
    const fileDropped = event.payload;
    if (
      !(
        fileDropped.y >= bounds.top &&
        fileDropped.y <= bounds.bottom &&
        fileDropped.x >= bounds.left &&
        fileDropped.x <= bounds.right
      )
    ) {
      if (overDropZone) return setOverDropZone(false);
      return;
    }

    const fileObject = new File(
      [fileDropped.buffer],
      getFileName(fileDropped.path)
    );

    setUploadQueue((prev) => [...prev, fileObject]);

    return setOverDropZone(false);
  }

  function handleMouseDropOver(event: Event<MouseDropOver>) {
    const mousePosition = event.payload.position;
    if (
      !(
        mousePosition.y >= bounds.top &&
        mousePosition.y <= bounds.bottom &&
        mousePosition.x >= bounds.left &&
        mousePosition.x <= bounds.right
      )
    ) {
      if (overDropZone) return setOverDropZone(false);
      return;
    }

    return setOverDropZone(true);
  }

  useEffect(() => {
    const unlisten = listen<DroppedFile>("drop-files", handleDroppedFile);

    return () => {
      unlisten.then((f) => f());
    };
  }, [dropZoneRef]);

  useEffect(() => {
    const unlisten = listen<MouseDropOver>(
      "tauri://drag-over",
      handleMouseDropOver
    );

    return () => {
      unlisten.then((f) => f());
    };
  }, [overDropZone, dropZoneRef]);

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
    uploadQueue.length > 0
      ? "accept"
      : isDragActive || overDropZone
      ? "active"
      : "pending";

  return (
    <div className="space-y-1">
      <div
        data-status={status}
        {...getRootProps()}
        ref={dropZoneRef}
        className="text-white/80 m-4 px-4 h-24 flex items-center border border-dashed rounded justify-center transition-all data-[status=active]:animate-pulse"
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
                className="text-red-900"
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
